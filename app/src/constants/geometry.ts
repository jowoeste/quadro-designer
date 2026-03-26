// src/constants/geometry.ts
// Physical dimensions and visual constants for Quadro parts.
//
// All dimensions are in meters (real-world scale). A Quadro tube is 35 cm = 0.35 m.
// Corrected in Phase 2A to match real Quadro dimensions:
//   - Connector body is 50 mm diameter (same as tube), not larger
//   - Port offset is 25 mm from center (tube end sits at body surface)
//   - Arm is 40 mm diameter, 50 mm long (hidden inside tube)

// === TUBE DIMENSIONS ===
export const TUBE_LENGTH = 0.35;              // 35 cm tube length
export const TUBE_RADIUS = 0.025;             // 50 mm outer diameter
export const TUBE_HALF_LENGTH = TUBE_LENGTH / 2;

export const TUBE_15_LENGTH = 0.15;           // 15 cm short tube
export const TUBE_15_HALF_LENGTH = TUBE_15_LENGTH / 2;

// === CONNECTOR DIMENSIONS ===
// The connector body is fused 50 mm tubes. At this scale, it's rendered as a sphere.
// Arms (40 mm diameter, 50 mm long) extend into tubes — not visible in assembled state.
export const CONNECTOR_BODY_RADIUS = 0.025;   // 50 mm diameter (same as tube)
export const PORT_OFFSET = 0.025;             // Tube end sits 25 mm from center (at body surface)
export const ARM_RADIUS = 0.020;              // 40 mm diameter arm (hidden inside tube)
export const ARM_LENGTH = 0.050;              // 50 mm arm length (hidden inside tube)

// === DIAGONAL CONNECTOR DIMENSIONS ===
// The diagonal (45°) connector is unique: Port A is a sleeve (slides over a connector arm),
// Port B is a standard arm (tubes connect to it). Origin = crossing point of both axes.
export const DIAG_SLEEVE_LENGTH = 0.070;      // 70mm horizontal sleeve
export const DIAG_CROSSING_TO_CLOSED = 0.010; // 10mm from origin to closed end
export const DIAG_PORT_A_OFFSET = 0.080;      // 80mm from origin to sleeve open end
export const DIAG_PORT_B_BODY_END = 0.060;    // 60mm from origin to where arm (40mm⌀) begins
export const DIAG_ARM_TOTAL = 0.110;          // 110mm from origin to diagonal open end

// === PANEL & CLAMP DIMENSIONS ===
export const PANEL_THICKNESS = 0.004;          // ~4mm thick
export const PANEL_40_SIZE = 0.40;             // 40cm
export const PANEL_20_SIZE = 0.20;             // 20cm
export const CLAMP_TUBE_SPACING = 0.45;        // 450mm = one cube side (tube center-to-center)
export const CLAMP_TOLERANCE = 0.03;           // 30mm tolerance for detecting parallel tube pairs
export const DOUBLE_TUBE_SIZE: [number, number, number] = [0.05, 0.03, 0.05]; // 50×30×50mm clamp block

// === SNAP SYSTEM ===
export const SNAP_DISTANCE = 0.20;            // Generous for easy snapping, especially diagonal arms

// === PORT INDICATORS ===
export const PORT_INDICATOR_RADIUS = 0.016;   // Visible on the connector sphere surface

// === PART COLORS (Phase 2: 2 tubes + 9 connectors) ===
export const PART_COLORS: Record<string, string> = {
  'tube':            '#4a90d9',   // Steel blue
  'tube-15':         '#74b9ff',   // Light blue — shorter tube
  'elbow':           '#e67e22',   // Orange
  't-connector':     '#2ecc71',   // Green
  'cross':           '#9b59b6',   // Purple
  '5-way':           '#e74c3c',   // Red
  '3-way-spatial':   '#1abc9c',   // Teal
  '4-way-spatial':   '#f39c12',   // Amber — distinct from cross (purple)
  '6-way':           '#c0392b',   // Dark red
  'straight':        '#95a5a6',   // Silver/gray
  'diagonal':        '#e84393',   // Pink — stands out as the non-90° part
  // Panels & clamps
  'panel-40x40':           '#dfe6e9',   // Light gray
  'panel-40x20':           '#b2bec3',   // Medium gray
  'double-tube-connector': '#636e72',   // Dark gray
};

export const SELECTED_COLOR = '#f1c40f';       // Yellow: selected part highlight
export const PORT_OPEN_COLOR = '#ffff00';      // Bright yellow: open port indicator
export const SNAP_HIGHLIGHT_COLOR = '#00ff88'; // Teal-green: ghost when snapping
