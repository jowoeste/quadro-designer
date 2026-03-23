// src/geometry/portDefs.ts
// Port definitions for each part type — defined in LOCAL (part) space.
//
// A "port" is an attachment point. Each port has:
//   - id: short string label (A, B, C, ...)
//   - position: offset from the part's origin (in local space, meters)
//   - direction: unit vector pointing OUTWARD (away from the part body)
//
// Coordinate conventions (in local/default space):
//   +X = right, +Y = up, +Z = forward
//   Tube axis runs along Z (end A at -Z, end B at +Z)
//   Connector arms point along ±X, ±Y, ±Z depending on connector type

import type { PartType, PortDef } from '../types/parts';
import { PORT_OFFSET, TUBE_HALF_LENGTH, TUBE_15_HALF_LENGTH } from '../constants/geometry';

const P = PORT_OFFSET; // shorthand for readability

// sin(45°) = cos(45°) ≈ 0.7071
const S45 = Math.SQRT1_2; // 0.7071067811865476

// ─── Tubes ───────────────────────────────────────────────────

// Tube 35 cm: two ends along the Z axis
export const TUBE_PORTS: PortDef[] = [
  { id: 'A', position: [0, 0, -TUBE_HALF_LENGTH], direction: [0, 0, -1] },
  { id: 'B', position: [0, 0,  TUBE_HALF_LENGTH], direction: [0, 0,  1] },
];

// Tube 15 cm: same structure, shorter
export const TUBE_15_PORTS: PortDef[] = [
  { id: 'A', position: [0, 0, -TUBE_15_HALF_LENGTH], direction: [0, 0, -1] },
  { id: 'B', position: [0, 0,  TUBE_15_HALF_LENGTH], direction: [0, 0,  1] },
];

// ─── Flat connectors (all ports in one plane) ────────────────

// Elbow: 2-way, 90° angle — ports along +X and +Y
export const ELBOW_PORTS: PortDef[] = [
  { id: 'A', position: [P, 0, 0], direction: [1, 0, 0] },
  { id: 'B', position: [0, P, 0], direction: [0, 1, 0] },
];

// T-connector: 3-way — two ports along ±X, one along +Z
export const T_CONNECTOR_PORTS: PortDef[] = [
  { id: 'A', position: [-P, 0, 0], direction: [-1, 0, 0] },
  { id: 'B', position: [ P, 0, 0], direction: [ 1, 0, 0] },
  { id: 'C', position: [0,  0, P], direction: [ 0, 0, 1] },
];

// Cross: 4-way, all in horizontal (XZ) plane
export const CROSS_PORTS: PortDef[] = [
  { id: 'A', position: [ P, 0,  0], direction: [ 1, 0,  0] },
  { id: 'B', position: [-P, 0,  0], direction: [-1, 0,  0] },
  { id: 'C', position: [0,  0,  P], direction: [ 0, 0,  1] },
  { id: 'D', position: [0,  0, -P], direction: [ 0, 0, -1] },
];

// ─── Spatial connectors (ports in 3D) ────────────────────────

// 3-way spatial: cube corner — +X, +Y, +Z
export const THREE_WAY_SPATIAL_PORTS: PortDef[] = [
  { id: 'A', position: [P, 0, 0], direction: [1, 0, 0] },
  { id: 'B', position: [0, P, 0], direction: [0, 1, 0] },
  { id: 'C', position: [0, 0, P], direction: [0, 0, 1] },
];

// 4-way spatial: horizontal T + one up — +X, -X, +Y, +Z
export const FOUR_WAY_SPATIAL_PORTS: PortDef[] = [
  { id: 'A', position: [ P, 0, 0], direction: [ 1, 0, 0] },
  { id: 'B', position: [-P, 0, 0], direction: [-1, 0, 0] },
  { id: 'C', position: [0,  P, 0], direction: [ 0, 1, 0] },
  { id: 'D', position: [0,  0, P], direction: [ 0, 0, 1] },
];

// 5-way: cross + up — ±X, ±Z, +Y
export const FIVE_WAY_PORTS: PortDef[] = [
  { id: 'A', position: [ P, 0,  0], direction: [ 1, 0,  0] },
  { id: 'B', position: [-P, 0,  0], direction: [-1, 0,  0] },
  { id: 'C', position: [0,  0,  P], direction: [ 0, 0,  1] },
  { id: 'D', position: [0,  0, -P], direction: [ 0, 0, -1] },
  { id: 'E', position: [0,  P,  0], direction: [ 0, 1,  0] },
];

// 6-way: all 6 axis directions — ±X, ±Y, ±Z
export const SIX_WAY_PORTS: PortDef[] = [
  { id: 'A', position: [ P, 0,  0], direction: [ 1, 0,  0] },
  { id: 'B', position: [-P, 0,  0], direction: [-1, 0,  0] },
  { id: 'C', position: [0,  P,  0], direction: [ 0, 1,  0] },
  { id: 'D', position: [0, -P,  0], direction: [ 0,-1,  0] },
  { id: 'E', position: [0,  0,  P], direction: [ 0, 0,  1] },
  { id: 'F', position: [0,  0, -P], direction: [ 0, 0, -1] },
];

// ─── Inline connector ────────────────────────────────────────

// Straight: 2-way, 180° (extends two tubes in a line)
export const STRAIGHT_PORTS: PortDef[] = [
  { id: 'A', position: [0, 0,  P], direction: [0, 0,  1] },
  { id: 'B', position: [0, 0, -P], direction: [0, 0, -1] },
];

// ─── Angled connector (non-90°) ──────────────────────────────

// TODO: adjust diagonal arm lengths when real measurements are available
// (the straight arm and angled arm may have different lengths)
// Diagonal: 2-way, 45° angle between arms
// Port A along +Z (horizontal), Port B at 45° upward-forward
// Direction B = [0, sin(45°), cos(45°)] = [0, 0.7071, 0.7071]
// Angle check: dot(A_dir, B_dir) = dot([0,0,1], [0, 0.7071, 0.7071]) = 0.7071
//   arccos(0.7071) = 45° ✓
export const DIAGONAL_PORTS: PortDef[] = [
  { id: 'A', position: [0, 0, P],              direction: [0, 0, 1] },
  { id: 'B', position: [0, P * S45, P * S45],  direction: [0, S45, S45] },
];

// ─── Lookup ──────────────────────────────────────────────────

export function getPortDefs(type: PartType): PortDef[] {
  switch (type) {
    case 'tube':           return TUBE_PORTS;
    case 'tube-15':        return TUBE_15_PORTS;
    case 'elbow':          return ELBOW_PORTS;
    case 't-connector':    return T_CONNECTOR_PORTS;
    case 'cross':          return CROSS_PORTS;
    case '3-way-spatial':  return THREE_WAY_SPATIAL_PORTS;
    case '4-way-spatial':  return FOUR_WAY_SPATIAL_PORTS;
    case '5-way':          return FIVE_WAY_PORTS;
    case '6-way':          return SIX_WAY_PORTS;
    case 'straight':       return STRAIGHT_PORTS;
    case 'diagonal':       return DIAGONAL_PORTS;
  }
}

// Create the initial connections record for a new part: all ports open (null = no connection)
export function initConnections(type: PartType): Record<string, null> {
  return Object.fromEntries(getPortDefs(type).map(p => [p.id, null]));
}
