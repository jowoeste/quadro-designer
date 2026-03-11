// src/constants/geometry.ts
// Physical dimensions and visual constants for Quadro parts.
//
// All dimensions are in meters (real-world scale). A Quadro tube is 35 cm = 0.35 m.
// The scene camera and grid are set up to show a ~3m × 3m build area comfortably.

// === TUBE DIMENSIONS ===
export const TUBE_LENGTH = 0.35;          // 35 cm tube length
export const TUBE_RADIUS = 0.025;         // 5 cm outer diameter
export const TUBE_HALF_LENGTH = TUBE_LENGTH / 2; // 17.5 cm (half-length, used often)

// === CONNECTOR DIMENSIONS ===
// The connector body is a central sphere. Arms extend from the sphere toward each port.
// Quadro tubes slide OVER the connector arms, so arm radius < tube radius.
export const CONNECTOR_BODY_RADIUS = 0.035; // 3.5 cm body sphere radius
export const PORT_OFFSET = 0.065;           // Distance from connector center to port tip (arm length)
export const ARM_RADIUS = 0.018;            // Arm cylinder radius (narrower than tube so tube slides over)

// === SNAP SYSTEM ===
// When the cursor is within SNAP_DISTANCE of an open port, the ghost part snaps to it.
// Larger = easier to snap but more accidental snaps. 12 cm feels right for this scale.
export const SNAP_DISTANCE = 0.20;

// === PORT INDICATORS ===
// Small spheres shown at open (unconnected) ports to give the user visual feedback.
export const PORT_INDICATOR_RADIUS = 0.016;

// === PART COLORS (Phase 1: simple solid colors, no textures) ===
export const PART_COLORS: Record<string, string> = {
  tube: '#4a90d9',          // Steel blue
  elbow: '#e67e22',         // Orange
  't-connector': '#2ecc71', // Green
  cross: '#9b59b6',         // Purple
  '5-way': '#e74c3c',       // Red
};

export const SELECTED_COLOR = '#f1c40f';      // Yellow: selected part highlight
export const PORT_OPEN_COLOR = '#ffff00';     // Bright yellow: open port indicator
export const SNAP_HIGHLIGHT_COLOR = '#00ff88'; // Teal-green: ghost when snapping
