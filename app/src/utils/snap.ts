// src/utils/snap.ts
// Snap-to-connector logic — the critical mechanic of the Quadro Designer.
//
// WHAT IT DOES:
//   When a user moves the cursor near an open port on a placed part, the ghost part
//   "snaps" into perfect alignment, so clicking will create a clean connection.
//
// HOW IT WORKS:
//   1. Collect all open ports in the scene (transform from local → world space)
//   2. Find the closest open port to the CAMERA RAY (not the ground-plane cursor)
//   3. Compute the exact position + quaternion so the placed part aligns to that port
//   4. Return a SnapResult, or null if no snap is detected

import * as THREE from 'three';
import type { PlacedPart, PartType, SnapResult } from '../types/parts';
import { isTubeType } from '../types/parts';
import { getPortDefs } from '../geometry/portDefs';
import { SNAP_DISTANCE, TUBE_HALF_LENGTH, TUBE_15_HALF_LENGTH } from '../constants/geometry';
import { composeSnapWithPreview } from './rotation';

// Get the half-length for a tube type (used to position tube center relative to snap port)
function tubeHalfLength(type: PartType): number {
  return type === 'tube-15' ? TUBE_15_HALF_LENGTH : TUBE_HALF_LENGTH;
}

// A port evaluated in world space (after applying the parent part's transform)
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

// Check for a snap when the user is placing a TUBE.
// Scans all open connector ports; returns the snap to the nearest one within range.
export function checkTubeSnap(
  ray: THREE.Ray,
  placingType: PartType,
  parts: PlacedPart[]
): SnapResult | null {
  // Only snap to connector ports (not to other tube ends)
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

      // Rotate tube so local +Z aligns with port outward direction
      // Position tube center at: portWorldPos + portDir * halfLength
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

// Check for a snap when the user is placing a CONNECTOR.
// Scans all open tube ends; snaps connector's first port (port A) to the nearest tube end.
export function checkConnectorSnap(
  ray: THREE.Ray,
  placingType: PartType,
  parts: PlacedPart[],
  previewQuat?: THREE.Quaternion
): SnapResult | null {
  const tubes = parts.filter(p => isTubeType(p.type));

  let bestSnap: SnapResult | null = null;
  let bestDist = SNAP_DISTANCE;

  const portDefs = getPortDefs(placingType);
  const portA = portDefs[0]; // always snap using port A
  const localPortADir = new THREE.Vector3(...portA.direction);
  const localPortAPos = new THREE.Vector3(...portA.position);

  for (const tube of tubes) {
    const openTubePorts = getWorldPorts(tube).filter(wp => !wp.isConnected);

    for (const tubePort of openTubePorts) {
      const dist = ray.distanceToPoint(tubePort.worldPosition);
      if (dist >= bestDist) continue;
      bestDist = dist;

      // The connector's port A should face TOWARD the tube (opposite to tube port direction)
      const targetConnDir = tubePort.worldDirection.clone().negate();

      let snapPos: [number, number, number];
      let snapQuat: [number, number, number, number];

      if (previewQuat && !previewQuat.equals(new THREE.Quaternion(0, 0, 0, 1))) {
        const composed = composeSnapWithPreview(
          previewQuat.clone(),
          localPortADir.clone(),
          localPortAPos.clone(),
          tubePort.worldPosition.clone(),
          targetConnDir,
        );
        snapPos = composed.position;
        snapQuat = composed.quaternion;
      } else {
        const quat = new THREE.Quaternion().setFromUnitVectors(localPortADir, targetConnDir);
        const rotatedLocalPortAPos = localPortAPos.clone().applyQuaternion(quat);
        const connPos = tubePort.worldPosition.clone().sub(rotatedLocalPortAPos);
        snapPos = [connPos.x, connPos.y, connPos.z];
        snapQuat = [quat.x, quat.y, quat.z, quat.w];
      }

      bestSnap = {
        position: snapPos,
        quaternion: snapQuat,
        localPortId: portA.id,
        targetPartId: tube.id,
        targetPortId: tubePort.portId,
      };
    }
  }

  return bestSnap;
}

// Main entry point: check snap for whichever part type is being placed.
export function checkSnap(
  ray: THREE.Ray,
  placingType: PartType,
  parts: PlacedPart[],
  previewQuat?: THREE.Quaternion
): SnapResult | null {
  if (isTubeType(placingType)) {
    return checkTubeSnap(ray, placingType, parts);
  } else {
    return checkConnectorSnap(ray, placingType, parts, previewQuat);
  }
}
