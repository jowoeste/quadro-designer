// src/utils/snap.ts
// Snap-to-connector logic — the critical mechanic of the Quadro Designer.
//
// SNAP PHILOSOPHY (Phase 2A):
//   - TUBES: auto-rotate to align with the connector port direction (tubes are symmetric)
//   - CONNECTORS: keep the user's chosen orientation. Only snap if an arm already
//     points toward a nearby tube end. The user controls rotation via X/Y/Z keys.
//     The snap system only adjusts position, never rotation.
//
// BOTH use camera-ray-based 3D detection so snapping works at any height.
//
// HOW IT WORKS:
//   Tube placement:
//     1. Find the nearest open connector port to the camera ray
//     2. Auto-rotate the tube to align with that port's direction
//     3. Position the tube center at portWorldPos + portDir * halfLength
//
//   Connector placement:
//     1. Find open tube ports near the camera ray (3D, any height)
//     2. For each nearby tube port, check if any ghost arm (in current preview
//        rotation) is anti-parallel to it (dot < -0.96)
//     3. If multiple arms match, pick the best direction alignment (most negative dot)
//     4. Offset position to align the matching ports exactly
//     5. Quaternion is UNCHANGED — the user's rotation is preserved

import * as THREE from 'three';
import type { PlacedPart, PartType, SnapResult } from '../types/parts';
import { isTubeType } from '../types/parts';
import { getPortDefs } from '../geometry/portDefs';
import { SNAP_DISTANCE, TUBE_HALF_LENGTH, TUBE_15_HALF_LENGTH } from '../constants/geometry';

// Direction tolerance: cos(15°) ≈ 0.966. Dot product must be < -0.96 (anti-parallel within ~15°)
const ANTI_PARALLEL_THRESHOLD = -0.96;

// Get the half-length for a tube type
function tubeHalfLength(type: PartType): number {
  return type === 'tube-15' ? TUBE_15_HALF_LENGTH : TUBE_HALF_LENGTH;
}

// A port evaluated in world space
export interface WorldPort {
  partId: string;
  portId: string;
  worldPosition: THREE.Vector3;
  worldDirection: THREE.Vector3;
  isConnected: boolean;
}

// Transform all of a part's ports from local space to world space.
export function getWorldPorts(part: PlacedPart): WorldPort[] {
  const partPos = new THREE.Vector3(...part.position);
  const partQuat = new THREE.Quaternion(
    part.quaternion[0], part.quaternion[1],
    part.quaternion[2], part.quaternion[3]
  );

  return getPortDefs(part.type).map(def => {
    const worldPos = new THREE.Vector3(...def.position)
      .applyQuaternion(partQuat)
      .add(partPos);

    const worldDir = new THREE.Vector3(...def.direction)
      .applyQuaternion(partQuat)
      .normalize();

    return {
      partId: part.id,
      portId: def.id,
      worldPosition: worldPos,
      worldDirection: worldDir,
      isConnected: part.connections[def.id] !== null,
    };
  });
}

// ─── Tube Snap ───────────────────────────────────────────────
// Tubes are symmetric → auto-rotate to align with the connector port direction.
// Uses camera ray distance for 3D snap detection.
export function checkTubeSnap(
  ray: THREE.Ray,
  placingType: PartType,
  parts: PlacedPart[]
): SnapResult | null {
  const connectors = parts.filter(p => !isTubeType(p.type));
  const halfLen = tubeHalfLength(placingType);

  let bestSnap: SnapResult | null = null;
  let bestDist = SNAP_DISTANCE;

  for (const connector of connectors) {
    const openPorts = getWorldPorts(connector).filter(wp => !wp.isConnected);

    for (const port of openPorts) {
      const dist = ray.distanceToPoint(port.worldPosition);
      if (dist >= bestDist) continue;
      bestDist = dist;

      // Auto-rotate tube so local +Z aligns with port outward direction
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        port.worldDirection
      );
      const tubeCenter = port.worldPosition.clone().addScaledVector(port.worldDirection, halfLen);

      bestSnap = {
        position: [tubeCenter.x, tubeCenter.y, tubeCenter.z],
        quaternion: [quat.x, quat.y, quat.z, quat.w],
        localPortId: 'A',
        targetPartId: connector.id,
        targetPortId: port.portId,
      };
    }
  }

  return bestSnap;
}

// ─── Connector Snap (NO auto-rotation, RAY-BASED 3D) ────────
// Uses camera ray to find open tube ports at any height, then checks if any
// ghost arm (in current preview rotation) is anti-parallel.
// When multiple arms match, the best direction alignment wins (most negative dot).
// Only position is adjusted, never rotation.
export function checkConnectorSnap(
  ray: THREE.Ray,
  placingType: PartType,
  previewQuat: THREE.Quaternion,
  parts: PlacedPart[]
): SnapResult | null {
  const tubes = parts.filter(p => isTubeType(p.type));
  const portDefs = getPortDefs(placingType);

  let bestSnap: SnapResult | null = null;
  let bestRayDist = SNAP_DISTANCE;
  let bestDirDot = ANTI_PARALLEL_THRESHOLD; // most negative = best alignment

  for (const tube of tubes) {
    const openTubePorts = getWorldPorts(tube).filter(wp => !wp.isConnected);

    for (const tubePort of openTubePorts) {
      // Step 1: Is the camera ray near this tube port? (3D check at any height)
      const rayDist = ray.distanceToPoint(tubePort.worldPosition);
      if (rayDist >= SNAP_DISTANCE) continue;

      // Step 2: Check each ghost arm against this tube port
      for (const ghostPortDef of portDefs) {
        // Ghost arm direction in world space (using preview rotation)
        const ghostPortWorldDir = new THREE.Vector3(...ghostPortDef.direction)
          .applyQuaternion(previewQuat)
          .normalize();

        // Check: do these ports face each other? (anti-parallel within ~15°)
        const dirDot = tubePort.worldDirection.dot(ghostPortWorldDir);
        if (dirDot > ANTI_PARALLEL_THRESHOLD) continue;

        // Step 3: Rank — prefer closer ray distance, then better direction alignment
        if (rayDist < bestRayDist || (rayDist <= bestRayDist + 0.001 && dirDot < bestDirDot)) {
          bestRayDist = rayDist;
          bestDirDot = dirDot;

          // Calculate snap position: place ghost so this port aligns exactly with tube port
          const ghostPortLocalRotated = new THREE.Vector3(...ghostPortDef.position)
            .applyQuaternion(previewQuat);
          const snapPos = tubePort.worldPosition.clone().sub(ghostPortLocalRotated);

          bestSnap = {
            position: [snapPos.x, snapPos.y, snapPos.z],
            quaternion: [previewQuat.x, previewQuat.y, previewQuat.z, previewQuat.w],
            localPortId: ghostPortDef.id,
            targetPartId: tube.id,
            targetPortId: tubePort.portId,
          };
        }
      }
    }
  }

  return bestSnap;
}

// ─── Main entry point ────────────────────────────────────────
export function checkSnap(
  ray: THREE.Ray,
  _cursorPos: THREE.Vector3,  // kept for API compat (ghost position when not snapping)
  placingType: PartType,
  parts: PlacedPart[],
  previewQuat: THREE.Quaternion
): SnapResult | null {
  if (isTubeType(placingType)) {
    return checkTubeSnap(ray, placingType, parts);
  } else {
    return checkConnectorSnap(ray, placingType, previewQuat, parts);
  }
}
