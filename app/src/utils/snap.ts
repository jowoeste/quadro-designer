// src/utils/snap.ts
// Snap-to-connector logic — the critical mechanic of the Quadro Designer.
//
// WHAT IT DOES:
//   When a user moves the cursor near an open port on a placed part, the ghost part
//   "snaps" into perfect alignment, so clicking will create a clean connection.
//
// HOW IT WORKS:
//   1. Collect all open ports in the scene (transform from local → world space)
//   2. Find the closest open port to the cursor (within SNAP_DISTANCE)
//   3. Compute the exact position + quaternion so the placed part aligns to that port
//   4. Return a SnapResult, or null if no snap is detected
//
// SNAP RULES (Phase 1):
//   - Tube placed near connector port → snap tube end A to that port
//   - Connector placed near tube end → snap connector port A to that tube end
//   - No tube-to-tube or connector-to-connector snapping (not physically meaningful for Quadro)
//
// MATH (tube snap to connector port):
//   Given connector port at world position P with outward direction D:
//   - We want tube end A (local [0,0,-halfLength]) to land at P
//   - Tube should extend from P in direction D (away from connector)
//   - Required rotation: rotate local +Z to match D  → quaternion.setFromUnitVectors([0,0,1], D)
//   - Required position: P + D * halfLength  (tube center is halfway along the tube from P)

import * as THREE from 'three';
import type { PlacedPart, PartType, SnapResult } from '../types/parts';
import { getPortDefs } from '../geometry/portDefs';
import { SNAP_DISTANCE, TUBE_HALF_LENGTH } from '../constants/geometry';

// A port evaluated in world space (after applying the parent part's transform)
export interface WorldPort {
  partId: string;
  portId: string;
  worldPosition: THREE.Vector3;
  worldDirection: THREE.Vector3; // unit vector, OUTWARD from the part body
  isConnected: boolean;
}

// Transform all of a part's ports from local space to world space.
// Uses the part's position (translation) and quaternion (rotation).
export function getWorldPorts(part: PlacedPart): WorldPort[] {
  const partPos = new THREE.Vector3(...part.position);
  const partQuat = new THREE.Quaternion(
    part.quaternion[0],
    part.quaternion[1],
    part.quaternion[2],
    part.quaternion[3]
  );

  return getPortDefs(part.type).map(def => {
    // Apply part rotation to local port position and direction
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
  cursorPos: THREE.Vector3,
  parts: PlacedPart[]
): SnapResult | null {
  // Only snap to connector ports (not to other tube ends)
  const connectors = parts.filter(p => p.type !== 'tube');

  let bestSnap: SnapResult | null = null;
  let bestDist = SNAP_DISTANCE;

  for (const connector of connectors) {
    const openPorts = getWorldPorts(connector).filter(wp => !wp.isConnected);

    for (const port of openPorts) {
      const dist = cursorPos.distanceTo(port.worldPosition);
      if (dist >= bestDist) continue;
      bestDist = dist;

      // Snap tube port A to this connector port:
      // - Rotate tube so local +Z aligns with port outward direction
      // - Position tube center at: portWorldPos + portDir * TUBE_HALF_LENGTH
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        port.worldDirection
      );
      const tubeCenter = port.worldPosition.clone().addScaledVector(port.worldDirection, TUBE_HALF_LENGTH);

      bestSnap = {
        position: [tubeCenter.x, tubeCenter.y, tubeCenter.z],
        quaternion: [quat.x, quat.y, quat.z, quat.w],
        localPortId: 'A',              // tube port A (at local -Z end) is snapping
        targetPartId: connector.id,
        targetPortId: port.portId,
      };
    }
  }

  return bestSnap;
}

// Check for a snap when the user is placing a CONNECTOR.
// Scans all open tube ends; snaps connector's first port (port A) to the nearest tube end.
//
// Math (connector snap to tube end):
//   Given tube end at world position P with outward direction D_tube:
//   - Physical connection requires the two ports to "face each other"
//   - Tube port dir = D_tube (outward from tube body, pointing away)
//   - Connector port A dir (in world) should = -D_tube (facing toward the tube)
//   - Find quaternion R that rotates local connPortA.direction to -D_tube
//   - Connector position: P - R(localPortA.position)
export function checkConnectorSnap(
  cursorPos: THREE.Vector3,
  placingType: PartType,
  parts: PlacedPart[]
): SnapResult | null {
  const tubes = parts.filter(p => p.type === 'tube');

  let bestSnap: SnapResult | null = null;
  let bestDist = SNAP_DISTANCE;

  // Get connector's first port definition (port A) for snapping
  const portDefs = getPortDefs(placingType);
  const portA = portDefs[0]; // always snap using port A
  const localPortADir = new THREE.Vector3(...portA.direction);
  const localPortAPos = new THREE.Vector3(...portA.position);

  for (const tube of tubes) {
    const openTubePorts = getWorldPorts(tube).filter(wp => !wp.isConnected);

    for (const tubePort of openTubePorts) {
      const dist = cursorPos.distanceTo(tubePort.worldPosition);
      if (dist >= bestDist) continue;
      bestDist = dist;

      // The connector's port A should face TOWARD the tube (opposite to tube port direction)
      const targetConnDir = tubePort.worldDirection.clone().negate();

      // Quaternion: rotate local portA direction to face the tube
      const quat = new THREE.Quaternion().setFromUnitVectors(localPortADir, targetConnDir);

      // Connector origin: position such that port A lands at the tube port world position
      // connPos + R(localPortAPos) = tubePort.worldPosition
      // → connPos = tubePort.worldPosition - R(localPortAPos)
      const rotatedLocalPortAPos = localPortAPos.clone().applyQuaternion(quat);
      const connPos = tubePort.worldPosition.clone().sub(rotatedLocalPortAPos);

      bestSnap = {
        position: [connPos.x, connPos.y, connPos.z],
        quaternion: [quat.x, quat.y, quat.z, quat.w],
        localPortId: portA.id,         // connector port A is snapping
        targetPartId: tube.id,
        targetPortId: tubePort.portId,
      };
    }
  }

  return bestSnap;
}

// Main entry point: check snap for whichever part type is being placed
export function checkSnap(
  cursorPos: THREE.Vector3,
  placingType: PartType,
  parts: PlacedPart[]
): SnapResult | null {
  if (placingType === 'tube') {
    return checkTubeSnap(cursorPos, parts);
  } else {
    return checkConnectorSnap(cursorPos, placingType, parts);
  }
}
