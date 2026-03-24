// src/utils/snap.ts
// Snap-to-connector logic — the critical mechanic of the Quadro Designer.
//
// SNAP PHILOSOPHY (Phase 2A):
//   - TUBES: auto-rotate to align with the connector port direction (tubes are symmetric)
//   - CONNECTORS: keep the user's chosen orientation. Only snap if an arm already
//     points toward a nearby tube end. The user controls rotation via X/Y/Z keys.
//     The snap system only adjusts position, never rotation.
//   - DIAGONAL: Port A (sleeve) snaps to connector arms, not tube ends.
//     Port B (arm) snaps to tube ends like any other connector arm.
//
// BOTH use camera-ray-based 3D detection so snapping works at any height.

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
// SKIPS sleeve-type ports — a tube cannot connect to a diagonal's Port A.
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
    const connPortDefs = getPortDefs(connector.type);
    const openPorts = getWorldPorts(connector).filter(wp => {
      if (wp.isConnected) return false;
      // Skip sleeve-type ports — tubes can't connect there
      const def = connPortDefs.find(d => d.id === wp.portId);
      return !def || def.portType !== 'sleeve';
    });

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
// Two-pass snap:
//   Pass 1: arm-type ghost ports → open TUBE ends
//   Pass 2: sleeve-type ghost ports → open CONNECTOR arms
// When multiple arms match, the best direction alignment wins (most negative dot).
// Only position is adjusted, never rotation.
export function checkConnectorSnap(
  ray: THREE.Ray,
  placingType: PartType,
  previewQuat: THREE.Quaternion,
  parts: PlacedPart[]
): SnapResult | null {
  const allPortDefs = getPortDefs(placingType);
  const armPortDefs = allPortDefs.filter(d => d.portType !== 'sleeve');
  const sleevePortDefs = allPortDefs.filter(d => d.portType === 'sleeve');

  let bestSnap: SnapResult | null = null;
  let bestRayDist = SNAP_DISTANCE;
  let bestDirDot = ANTI_PARALLEL_THRESHOLD; // most negative = best alignment

  // Helper: try snapping ghost port defs against target world ports
  function trySnap(
    targetPorts: WorldPort[],
    ghostPortDefs: typeof allPortDefs,
    targetPartId: string
  ) {
    for (const targetPort of targetPorts) {
      const rayDist = ray.distanceToPoint(targetPort.worldPosition);
      if (rayDist >= SNAP_DISTANCE) continue;

      for (const ghostPortDef of ghostPortDefs) {
        const ghostDir = new THREE.Vector3(...ghostPortDef.direction)
          .applyQuaternion(previewQuat)
          .normalize();

        const dirDot = targetPort.worldDirection.dot(ghostDir);
        if (dirDot > ANTI_PARALLEL_THRESHOLD) continue;

        // Rank: prefer closer ray distance, then better direction alignment
        if (rayDist < bestRayDist || (rayDist <= bestRayDist + 0.001 && dirDot < bestDirDot)) {
          bestRayDist = rayDist;
          bestDirDot = dirDot;

          const offset = new THREE.Vector3(...ghostPortDef.position).applyQuaternion(previewQuat);
          const snapPos = targetPort.worldPosition.clone().sub(offset);

          bestSnap = {
            position: [snapPos.x, snapPos.y, snapPos.z],
            quaternion: [previewQuat.x, previewQuat.y, previewQuat.z, previewQuat.w],
            localPortId: ghostPortDef.id,
            targetPartId,
            targetPortId: targetPort.portId,
          };
        }
      }
    }
  }

  // ─── Pass 1: arm ports → open TUBE ends ───
  if (armPortDefs.length > 0) {
    const tubes = parts.filter(p => isTubeType(p.type));
    for (const tube of tubes) {
      const openTubePorts = getWorldPorts(tube).filter(wp => !wp.isConnected);
      trySnap(openTubePorts, armPortDefs, tube.id);
    }
  }

  // ─── Pass 2: sleeve ports → open CONNECTOR arms ───
  if (sleevePortDefs.length > 0) {
    const connectors = parts.filter(p => !isTubeType(p.type));
    for (const connector of connectors) {
      const connPortDefs = getPortDefs(connector.type);
      const openConnPorts = getWorldPorts(connector).filter(wp => {
        if (wp.isConnected) return false;
        // Only snap to arm-type ports (sleeve can't snap to another sleeve)
        const def = connPortDefs.find(d => d.id === wp.portId);
        return !def || def.portType !== 'sleeve';
      });
      trySnap(openConnPorts, sleevePortDefs, connector.id);
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
