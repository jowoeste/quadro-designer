// src/utils/rotation.ts
// Pure rotation utility functions for the connector rotation feature.
//
// This file has NO React or Zustand dependencies — it is pure math.
//
// KEY CONCEPTS:
//   - All rotations are 90° increments around world X, Y, or Z axes.
//   - Pre-placement: user accumulates rotations via X/Y/Z keys, composing quaternions.
//   - Snap composition: when snapping to a port, the user's "roll" around the connection
//     axis is preserved by composing the snap correction on top of the preview quaternion.
//   - Post-placement: rigid subtree rotation — all parts connected through non-axis ports
//     are rotated as a rigid body around the connector's center.

import * as THREE from 'three';
import type { PlacedPart } from '../types/parts';
import { getPortDefs } from '../geometry/portDefs';

// ── Axis Rotation Quaternion ──────────────────────────────────

/**
 * Create a quaternion representing a rotation around the given world axis.
 * Supports 90° (default) and 45° steps via the `fine` parameter.
 * Used for both pre-placement preview rotation and post-placement in-place rotation.
 */
export function axisRotationQuat(axis: 'x' | 'y' | 'z', fine: boolean = false): THREE.Quaternion {
  const angle = fine ? Math.PI / 4 : Math.PI / 2; // 45° or 90°
  switch (axis) {
    case 'x': return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle);
    case 'y': return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    case 'z': return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
  }
}

/** @deprecated Use axisRotationQuat instead. Kept for backward compatibility. */
export function axis90Quat(axis: 'x' | 'y' | 'z'): THREE.Quaternion {
  return axisRotationQuat(axis, false);
}

// ── Snap + Preview Composition ────────────────────────────────

/**
 * Compose a user's preview rotation with snap alignment, preserving "roll."
 *
 * Without this, snapping always uses the minimal rotation (setFromUnitVectors),
 * which ignores the user's chosen orientation around the connection axis.
 *
 * Steps:
 *   1. D_a = previewQuat * localPortADir  → where port A points under user rotation
 *   2. Q_fix = setFromUnitVectors(D_a, targetDir) → correction to align port A
 *   3. Q_final = Q_fix * previewQuat → preserves the user's roll around the snap axis
 *   4. position = targetWorldPos - Q_final * localPortAPos
 *
 * @param previewQuat    The user's accumulated rotation from X/Y/Z key presses
 * @param localPortADir  Port A's direction in local (unrotated) connector space
 * @param localPortAPos  Port A's position in local connector space
 * @param targetWorldPos The world-space position of the port we're snapping to
 * @param targetDir      The direction the connector's port A should face (already negated for connectors)
 */
export function composeSnapWithPreview(
  previewQuat: THREE.Quaternion,
  localPortADir: THREE.Vector3,
  localPortAPos: THREE.Vector3,
  targetWorldPos: THREE.Vector3,
  targetDir: THREE.Vector3,
): { quaternion: [number, number, number, number]; position: [number, number, number] } {
  // Step 1: Where does port A point under the user's preview rotation?
  const Da = localPortADir.clone().applyQuaternion(previewQuat).normalize();

  // Step 2: Compute correction quaternion to fix alignment
  const Qfix = new THREE.Quaternion().setFromUnitVectors(Da, targetDir);

  // Step 3: Compose — final = Qfix * previewQuat (preserves roll around snap axis)
  const Qfinal = Qfix.multiply(previewQuat);

  // Step 4: Position connector so port A lands at targetWorldPos
  const rotatedLocalPortAPos = localPortAPos.clone().applyQuaternion(Qfinal);
  const connPos = targetWorldPos.clone().sub(rotatedLocalPortAPos);

  return {
    quaternion: [Qfinal.x, Qfinal.y, Qfinal.z, Qfinal.w],
    position: [connPos.x, connPos.y, connPos.z],
  };
}

// ── Connected Axes Detection ──────────────────────────────────

/**
 * Determine which world-space axes have connected ports on the given connector.
 *
 * Since all rotations are 90° increments, port world directions are always exactly
 * along a cardinal axis (±X, ±Y, ±Z), up to floating-point epsilon. We snap to the
 * nearest cardinal axis using largest-absolute-component.
 *
 * @returns Set of axis names ('x', 'y', 'z') that have at least one connected port.
 */
export function getConnectedAxes(connector: PlacedPart): Set<'x' | 'y' | 'z'> {
  const axes = new Set<'x' | 'y' | 'z'>();
  const partQuat = new THREE.Quaternion(
    connector.quaternion[0], connector.quaternion[1],
    connector.quaternion[2], connector.quaternion[3]
  );
  const portDefs = getPortDefs(connector.type);

  for (const def of portDefs) {
    // Skip unconnected ports
    if (connector.connections[def.id] === null) continue;

    // Transform port direction to world space
    const worldDir = new THREE.Vector3(...def.direction)
      .applyQuaternion(partQuat)
      .normalize();

    // Snap to nearest cardinal axis (largest absolute component)
    const ax = worldDir.toArray().map(Math.abs);
    if (ax[0] >= ax[1] && ax[0] >= ax[2]) axes.add('x');
    else if (ax[1] >= ax[0] && ax[1] >= ax[2]) axes.add('y');
    else axes.add('z');
  }

  return axes;
}

// ── Rotation Constraint Check ─────────────────────────────────

/**
 * Check if rotation around a given axis is allowed for a connector.
 *
 * Rules:
 *   - Tubes cannot be rotated (they're symmetric cylinders)
 *   - 0 connected ports → free rotation (any axis)
 *   - 1 unique connected axis → only rotation around that axis
 *   - 2+ unique connected axes → locked (no rotation)
 */
export function canRotate(
  connector: PlacedPart,
  requestedAxis: 'x' | 'y' | 'z'
): boolean {
  if (connector.type === 'tube' || connector.type === 'tube-15') return false;

  const connectedAxes = getConnectedAxes(connector);

  if (connectedAxes.size === 0) return true;   // free rotation
  if (connectedAxes.size >= 2) return false;    // locked

  // Exactly 1 connected axis: only allow rotation around that axis
  const singleAxis = [...connectedAxes][0];
  return requestedAxis === singleAxis;
}

// ── Rigid Subtree Collection ──────────────────────────────────

/**
 * Collect all parts reachable from `connector` through ports that are NOT
 * on the rotation axis. These parts must move rigidly with the connector.
 *
 * When a connector rotates around axis A, any tube connected along axis A
 * stays fixed (coaxial with rotation). But parts connected on other ports
 * must rotate with it, and so must everything connected to those parts, etc.
 *
 * Uses BFS. The connector itself is NOT included in the result.
 *
 * @returns Array of part IDs that should move with the rotation.
 */
export function collectRigidSubtree(
  connector: PlacedPart,
  rotationAxis: 'x' | 'y' | 'z',
  allParts: PlacedPart[]
): string[] {
  const partsMap = new Map(allParts.map(p => [p.id, p]));
  const visited = new Set<string>([connector.id]); // don't revisit the connector
  const result: string[] = [];
  const queue: string[] = [];

  const partQuat = new THREE.Quaternion(
    connector.quaternion[0], connector.quaternion[1],
    connector.quaternion[2], connector.quaternion[3]
  );

  // Seed BFS: start from non-rotation-axis ports of the connector
  const portDefs = getPortDefs(connector.type);
  for (const def of portDefs) {
    const conn = connector.connections[def.id];
    if (!conn) continue;

    // Determine if this port lies on the rotation axis
    const worldDir = new THREE.Vector3(...def.direction)
      .applyQuaternion(partQuat)
      .normalize();
    const ax = worldDir.toArray().map(Math.abs);
    let portAxis: 'x' | 'y' | 'z';
    if (ax[0] >= ax[1] && ax[0] >= ax[2]) portAxis = 'x';
    else if (ax[1] >= ax[0] && ax[1] >= ax[2]) portAxis = 'y';
    else portAxis = 'z';

    // If this port is on the rotation axis, its subtree stays fixed → skip
    if (portAxis === rotationAxis) continue;

    // Otherwise, the connected part must move
    if (!visited.has(conn.toPartId)) {
      visited.add(conn.toPartId);
      queue.push(conn.toPartId);
      result.push(conn.toPartId);
    }
  }

  // BFS: traverse all connections of each queued part (full propagation)
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = partsMap.get(currentId);
    if (!current) continue;

    for (const [, conn] of Object.entries(current.connections)) {
      if (!conn) continue;
      if (visited.has(conn.toPartId)) continue;
      visited.add(conn.toPartId);
      queue.push(conn.toPartId);
      result.push(conn.toPartId);
    }
  }

  return result;
}

// ── Position / Quaternion Transform Helpers ────────────────────

/**
 * Rotate a point around a pivot by a quaternion.
 * offset = point - pivot → rotate offset → add pivot back.
 */
export function rotatePositionAroundPivot(
  partPosition: [number, number, number],
  pivot: [number, number, number],
  rotQuat: THREE.Quaternion
): [number, number, number] {
  const offset = new THREE.Vector3(
    partPosition[0] - pivot[0],
    partPosition[1] - pivot[1],
    partPosition[2] - pivot[2]
  );
  offset.applyQuaternion(rotQuat);
  return [
    offset.x + pivot[0],
    offset.y + pivot[1],
    offset.z + pivot[2],
  ];
}

/**
 * Compose two quaternions: result = rotQuat * existing.
 * This applies `rotQuat` on top of the `existing` orientation.
 */
export function composeQuaternions(
  rotQuat: THREE.Quaternion,
  existing: [number, number, number, number]
): [number, number, number, number] {
  const eq = new THREE.Quaternion(existing[0], existing[1], existing[2], existing[3]);
  const result = rotQuat.clone().multiply(eq);
  return [result.x, result.y, result.z, result.w];
}
