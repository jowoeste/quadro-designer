// src/geometry/portDefs.ts
// Port definitions for each part type — defined in LOCAL (part) space.
//
// A "port" is an attachment point. Each port has:
//   - id: short string label (A, B, C, ...)
//   - position: offset from the part's origin (in local space, meters)
//   - direction: unit vector pointing OUTWARD (away from the part body)
//
// When a tube connects to a connector:
//   - The tube end aligns to the connector port's world-space position
//   - The tube extends in the port's outward direction (away from the connector)
//
// Coordinate conventions (in local/default space):
//   +X = right, +Y = up, +Z = forward
//   Tube axis runs along Z (end A at -Z, end B at +Z)
//   Connector arms point along ±X, ±Y, ±Z depending on connector type

import type { PartType, PortDef } from '../types/parts';
import { PORT_OFFSET, TUBE_HALF_LENGTH } from '../constants/geometry';

const P = PORT_OFFSET; // shorthand for readability

// Tube: two ends along the Z axis.
// Default orientation: tube runs along Z, so orbiting works intuitively.
export const TUBE_PORTS: PortDef[] = [
  { id: 'A', position: [0, 0, -TUBE_HALF_LENGTH], direction: [0, 0, -1] }, // back end
  { id: 'B', position: [0, 0,  TUBE_HALF_LENGTH], direction: [0, 0,  1] }, // front end
];

// Elbow: 2-way, 90° angle — ports along +X and +Y
// Creates an L-shaped corner (horizontal → vertical)
export const ELBOW_PORTS: PortDef[] = [
  { id: 'A', position: [P, 0, 0], direction: [1, 0, 0] }, // right
  { id: 'B', position: [0, P, 0], direction: [0, 1, 0] }, // up
];

// T-connector: 3-way — two ports along ±X (horizontal bar), one along +Z (stem)
// Creates a T shape lying flat, with one connection going forward
export const T_CONNECTOR_PORTS: PortDef[] = [
  { id: 'A', position: [-P, 0, 0], direction: [-1, 0, 0] }, // left
  { id: 'B', position: [ P, 0, 0], direction: [ 1, 0, 0] }, // right
  { id: 'C', position: [0,  0, P], direction: [ 0, 0, 1] }, // forward
];

// Cross: 4-way, all ports in the horizontal (XZ) plane
// Used for floor-level intersections where 4 tubes meet flat
export const CROSS_PORTS: PortDef[] = [
  { id: 'A', position: [ P, 0,  0], direction: [ 1, 0,  0] }, // right
  { id: 'B', position: [-P, 0,  0], direction: [-1, 0,  0] }, // left
  { id: 'C', position: [0,  0,  P], direction: [ 0, 0,  1] }, // forward
  { id: 'D', position: [0,  0, -P], direction: [ 0, 0, -1] }, // backward
];

// 5-way: cross + one port pointing up (+Y)
// The most versatile connector — 4 horizontal connections + 1 vertical up
export const FIVE_WAY_PORTS: PortDef[] = [
  { id: 'A', position: [ P, 0,  0], direction: [ 1, 0,  0] }, // right
  { id: 'B', position: [-P, 0,  0], direction: [-1, 0,  0] }, // left
  { id: 'C', position: [0,  0,  P], direction: [ 0, 0,  1] }, // forward
  { id: 'D', position: [0,  0, -P], direction: [ 0, 0, -1] }, // backward
  { id: 'E', position: [0,  P,  0], direction: [ 0, 1,  0] }, // up
];

// 3-way spatial (Raumkupplung 3-armig): 3 ports in perpendicular directions (+X, +Y, +Z)
// Like the corner of a cube — needed for building 3D structures (cube corners, house corners)
export const THREE_WAY_SPATIAL_PORTS: PortDef[] = [
  { id: 'A', position: [P, 0, 0], direction: [1, 0, 0] }, // right
  { id: 'B', position: [0, P, 0], direction: [0, 1, 0] }, // up
  { id: 'C', position: [0, 0, P], direction: [0, 0, 1] }, // forward
];

// Lookup: get port definitions for any part type
export function getPortDefs(type: PartType): PortDef[] {
  switch (type) {
    case 'tube':           return TUBE_PORTS;
    case 'elbow':          return ELBOW_PORTS;
    case 't-connector':    return T_CONNECTOR_PORTS;
    case 'cross':          return CROSS_PORTS;
    case '5-way':          return FIVE_WAY_PORTS;
    case '3-way-spatial':  return THREE_WAY_SPATIAL_PORTS;
  }
}

// Create the initial connections record for a new part: all ports open (null = no connection)
export function initConnections(type: PartType): Record<string, null> {
  return Object.fromEntries(getPortDefs(type).map(p => [p.id, null]));
}
