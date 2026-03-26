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
import { isTubeType, isPanelType } from '../types/parts';
import { getPortDefs } from '../geometry/portDefs';
import { SNAP_DISTANCE, TUBE_HALF_LENGTH, TUBE_15_HALF_LENGTH, CLAMP_TUBE_SPACING, CLAMP_TOLERANCE } from '../constants/geometry';

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
      // Robust check: treat both null and undefined as "not connected"
      // Only an actual Connection object means connected
      isConnected: !!part.connections[def.id],
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

// ─── Clamp Snap (Panels & Double Tube Connector) ─────────────
// Panels and clamps attach between two parallel tubes that are one cube side apart.
// Detection: find tube pairs where axes are parallel, perpendicular spacing ≈ 450mm,
// and the camera ray is near the midpoint.
export interface ClampSnapExtra {
  tubeAId: string;
  tubeBId: string;
}

export function checkClampSnap(
  ray: THREE.Ray,
  _placingType: PartType,
  parts: PlacedPart[],
  previewQuat: THREE.Quaternion
): SnapResult | null {
  const tubes = parts.filter(p => isTubeType(p.type));
  if (tubes.length < 2) return null;

  let bestSnap: SnapResult | null = null;
  let bestRayDist = SNAP_DISTANCE * 3; // panels need a more generous detection range

  for (let i = 0; i < tubes.length - 1; i++) {
    for (let j = i + 1; j < tubes.length; j++) {
      const tubeA = tubes[i];
      const tubeB = tubes[j];

      // Get tube axis directions (local +Z rotated by part quaternion)
      const quatA = new THREE.Quaternion(tubeA.quaternion[0], tubeA.quaternion[1], tubeA.quaternion[2], tubeA.quaternion[3]);
      const quatB = new THREE.Quaternion(tubeB.quaternion[0], tubeB.quaternion[1], tubeB.quaternion[2], tubeB.quaternion[3]);
      const axisA = new THREE.Vector3(0, 0, 1).applyQuaternion(quatA).normalize();
      const axisB = new THREE.Vector3(0, 0, 1).applyQuaternion(quatB).normalize();

      // Check parallel: |dot(axisA, axisB)| > 0.98
      const axisDot = Math.abs(axisA.dot(axisB));
      if (axisDot < 0.98) continue;

      // Compute perpendicular distance between tube center lines
      const posA = new THREE.Vector3(...tubeA.position);
      const posB = new THREE.Vector3(...tubeB.position);
      const delta = posB.clone().sub(posA);
      const alongAxis = delta.dot(axisA);
      const perpVec = delta.clone().addScaledVector(axisA, -alongAxis);
      const perpDist = perpVec.length();

      // Check spacing ≈ 450mm
      if (Math.abs(perpDist - CLAMP_TUBE_SPACING) > CLAMP_TOLERANCE) continue;

      // Compute midpoint between the two tube centers
      const midpoint = posA.clone().add(posB).multiplyScalar(0.5);

      // Find closest point on the ray to the midpoint, then project onto tube axis
      const rayPoint = ray.closestPointToPoint(midpoint, new THREE.Vector3());
      const t = rayPoint.clone().sub(midpoint).dot(axisA);
      const clampedPos = midpoint.clone().addScaledVector(axisA, t);

      // Check ray distance
      const rayDist = ray.distanceToPoint(clampedPos);
      if (rayDist >= bestRayDist) continue;

      // Compute orientation: panel local Y perpendicular to tube-connecting direction,
      // panel local Z along tube axis
      const connectingDir = perpVec.clone().normalize();
      // Build a quaternion that orients the panel:
      //   local Y → connectingDir (panel faces between tubes)
      //   local Z → axisA (panel aligns with tube axis)
      const localX = new THREE.Vector3().crossVectors(connectingDir, axisA).normalize();
      const mat = new THREE.Matrix4().makeBasis(localX, connectingDir, axisA);
      const baseQuat = new THREE.Quaternion().setFromRotationMatrix(mat);

      // Apply user's preview rotation on top
      const finalQuat = previewQuat.clone().multiply(baseQuat);

      bestRayDist = rayDist;
      bestSnap = {
        position: [clampedPos.x, clampedPos.y, clampedPos.z],
        quaternion: [finalQuat.x, finalQuat.y, finalQuat.z, finalQuat.w],
        localPortId: 'clamp',
        targetPartId: tubeA.id,
        targetPortId: 'body',
      };
      // Store tubeB id in a way placePart can access — we encode it in targetPortId
      // Format: "body:tubeBId"
      bestSnap.targetPortId = `body:${tubeB.id}`;
    }
  }

  return bestSnap;
}

// ─── Post-placement: find additional port alignments ─────────
// After placing a part with one snap connection, check if any of its OTHER
// open ports happen to align perfectly with open ports on existing parts.
// This closes both ends when a tube is placed between two connectors.
// Tolerances are generous to handle floating-point accumulation across
// multiple snap operations. Minimum port-to-port distance on a single part
// is ~35mm (cross connector), so 30mm is safe against false positives.
const ALIGN_DISTANCE = 0.03;  // 30mm tolerance (handles FP drift across snaps)
const ALIGN_DOT = -0.85;      // anti-parallel within ~32° (handles composed rotations)

export interface AdditionalConnection {
  localPortId: string;
  targetPartId: string;
  targetPortId: string;
}

export function findAdditionalConnections(
  newPart: PlacedPart,
  existingParts: PlacedPart[],
  alreadyConnectedPortId: string | null
): AdditionalConnection[] {
  const newPorts = getWorldPorts(newPart);
  const results: AdditionalConnection[] = [];

  for (const newPort of newPorts) {
    // Skip already-connected port (the snap target)
    if (newPort.portId === alreadyConnectedPortId) continue;
    if (newPort.isConnected) continue;

    // Determine what this port can connect to based on portType
    const newPortDef = getPortDefs(newPart.type).find(d => d.id === newPort.portId);
    const isSleeve = newPortDef?.portType === 'sleeve';

    for (const existing of existingParts) {
      const existingPortDefs = getPortDefs(existing.type);
      const existingPorts = getWorldPorts(existing);

      for (const exPort of existingPorts) {
        if (exPort.isConnected) continue;

        // Check port type compatibility:
        // - sleeve ports connect to arm ports on connectors
        // - arm ports on tubes connect to arm ports on connectors
        // - arm ports on connectors connect to tube ends
        const exPortDef = existingPortDefs.find(d => d.id === exPort.portId);
        const exIsSleeve = exPortDef?.portType === 'sleeve';

        // Sleeve can't connect to sleeve
        if (isSleeve && exIsSleeve) continue;

        // Sleeve connects to connector arms only (not tubes)
        if (isSleeve && isTubeType(existing.type)) continue;

        // Non-sleeve connector port connects to tube ends only
        if (!isSleeve && !isTubeType(newPart.type) && !isTubeType(existing.type)) continue;

        // Tube port connects to connector arms only (not other tubes)
        if (isTubeType(newPart.type) && isTubeType(existing.type)) continue;

        // Check spatial alignment: positions close + directions anti-parallel
        const dist = newPort.worldPosition.distanceTo(exPort.worldPosition);
        if (dist > ALIGN_DISTANCE) continue;

        const dot = newPort.worldDirection.dot(exPort.worldDirection);
        if (dot > ALIGN_DOT) continue;

        results.push({
          localPortId: newPort.portId,
          targetPartId: existing.id,
          targetPortId: exPort.portId,
        });
        break; // one match per port is enough
      }
    }
  }

  return results;
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
  } else if (isPanelType(placingType)) {
    return checkClampSnap(ray, placingType, parts, previewQuat);
  } else {
    return checkConnectorSnap(ray, placingType, previewQuat, parts);
  }
}
