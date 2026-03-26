// src/types/parts.ts
// Core TypeScript types for the Quadro Designer app.
//
// These types define the data model for:
//   - PartType: which kinds of parts exist
//   - PortDef: an attachment point (defined in LOCAL space)
//   - PlacedPart: a part placed in the 3D scene (world position + rotation + connections)
//   - SnapResult: what the snap system returns when a snap is detected

// All part types supported in the Quadro Designer
export type PartType =
  | 'tube' | 'tube-15'                                               // tubes
  | 'elbow' | 't-connector' | 'cross'                                // flat connectors
  | '3-way-spatial' | '4-way-spatial' | '5-way' | '6-way'            // spatial connectors
  | 'straight'                                                        // inline connector
  | 'diagonal'                                                        // 45° connector
  | 'panel-40x40' | 'panel-40x20'                                    // panels
  | 'double-tube-connector';                                          // tube clamp

// Helper: is this part type a tube (vs. a connector)?
export function isTubeType(type: PartType): boolean {
  return type === 'tube' || type === 'tube-15';
}

// Helper: is this a panel or clamp type? (uses clamp snap, not port snap)
export function isPanelType(type: PartType): boolean {
  return type === 'panel-40x40' || type === 'panel-40x20' || type === 'double-tube-connector';
}

// A port definition in LOCAL (part) space.
// Ports are the attachment points where tubes connect to connectors.
// Convention: `direction` points OUTWARD from the part body (away from center).
export interface PortDef {
  id: string;
  // Offset from part origin in local space (meters)
  position: [number, number, number];
  // Unit vector pointing away from the part (determines tube attachment direction)
  direction: [number, number, number];
  // 'arm' (default) = standard connector arm, tubes connect here
  // 'sleeve' = tube-like sleeve, connects to a connector arm (only diagonal Port A)
  portType?: 'arm' | 'sleeve';
}

// A live connection between two parts (recorded on both sides).
// When port X on part A connects to port Y on part B:
//   partA.connections['X'] = { toPartId: B.id, toPortId: 'Y' }
//   partB.connections['Y'] = { toPartId: A.id, toPortId: 'X' }
export interface Connection {
  toPartId: string;
  toPortId: string;
}

// A part that has been placed in the 3D scene.
export interface PlacedPart {
  id: string;
  type: PartType;
  // World-space position of the part's origin (meters)
  position: [number, number, number];
  // World-space rotation as quaternion [x, y, z, w]
  quaternion: [number, number, number, number];
  // Map from portId → Connection | null (null = open/unconnected)
  connections: Record<string, Connection | null>;
  // For panel/clamp parts: which two tubes they clamp onto
  clampedTo?: { tubeAId: string; tubeBId: string };
}

// Result returned by the snap system.
// Describes how to position/orient the part being placed so it aligns with an existing port.
export interface SnapResult {
  // Where the placed part's origin should go
  position: [number, number, number];
  // How the placed part should be rotated
  quaternion: [number, number, number, number];
  // Which port on the NEW part (being placed) is snapping
  localPortId: string;
  // Which existing part and port it snaps to
  targetPartId: string;
  targetPortId: string;
}
