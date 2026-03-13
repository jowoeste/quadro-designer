# Phase 1: Proof-of-Principle — Completion Checklist

*Track progress here. Mark items [x] when done and verified.*

**Success criterion:** You can build a simple climbing frame (e.g., a cube with legs, or design #05 "My First Castle with Ramp" from the Adventure manual) in the browser, using snap-to-connector with correct connector orientations.

---

## Project Setup

- [x] React + TypeScript + Vite project created
- [x] React Three Fiber + Three.js + drei + Zustand installed
- [x] Git repository initialized
- [x] GitHub repository created and code pushed
- [x] Dev server starts without errors
- [x] Blank 3D scene visible in browser

## Parts (Parametric Geometry)

- [x] Tube 35 cm — cylinder, 5 cm diameter
- [ ] ~~Tube 15 cm~~ — deferred to Phase 2 (no technical risk)
- [x] Elbow connector (2-way, 90°) — with 2 visible open ports
- [x] T-connector (3-way, flat) — with 3 visible open ports
- [x] Cross connector (4-way, flat) — with 4 visible open ports
- [ ] **3-way spatial connector (Raumkupplung 3-armig)** — MISSING, needed for cube corners → FIX PRIORITY 3
- [ ] ~~4-way spatial connector (Raumkupplung 4-armig)~~ — deferred (5-way is included, sufficient)
- [ ] ~~Diagonal connector (135°)~~ — deferred to Phase 1b or Phase 2
- [x] Each connector clearly shows which ports are open vs. occupied
- [ ] ~~Panels, double tube connectors~~ — deferred to Phase 2

## 3D Viewport

- [x] Orbit camera controls (drag to rotate view)
- [x] Zoom (scroll wheel)
- [x] Pan (right-click drag or shift+drag)
- [x] Ground grid for spatial reference
- [x] Reasonable default camera position and lighting
- [ ] **Coordinate system indicator** (XYZ axes with labels in corner) → FIX PRIORITY 5

## Parts Sidebar

- [x] Sidebar shows all available part types
- [x] Click to select a part type for placement
- [x] Visual indicator showing which part is currently selected

## Connector Rotation (CRITICAL)

### Before placement (during selection/preview)
- [x] Selected connector can be rotated around X-axis in 90° steps
- [x] Selected connector can be rotated around Y-axis in 90° steps
- [x] Selected connector can be rotated around Z-axis in 90° steps
- [x] Rotation controls work (X/Y/Z keys)
- [x] Preview shows the connector in its current rotation before placing
- [ ] **Rotation preview is instant** (currently laggy with animation) → FIX PRIORITY 4

### After placement (with constraints)
- [x] A placed connector with one tube can be rotated around that tube's axis (90° steps)
- [x] Rotation after placement is in 90° steps
- [ ] ~~Rotation after placement moves all other attached parts~~ — deferred to Phase 2
- [x] A connector with tubes on 2+ axes cannot be freely rotated (locked)

## Snap-to-Connector (CRITICAL)

- [x] When placing a tube near an open connector port, it highlights the valid snap point
- [x] Releasing/clicking snaps the tube into place, aligned with the port direction
- [x] A tube connects two connectors: when one end snaps, the other end shows valid positions
- [ ] **Connectors snap onto vertical tube ends (3D snapping)** — BROKEN, only works on horizontal plane → FIX PRIORITY 1
- [x] Invalid placements (occupied port, wrong angle) are prevented
- [ ] Snap works correctly for all connector types and all rotation states — blocked by 3D snap bug

## Selection & Editing

- [x] Click an existing part to select it (visual highlight)
- [x] Delete selected part (Delete/Backspace key)
- [x] Deleting a part frees connections on neighboring parts

## Undo/Redo

- [x] Undo (Ctrl+Z / Cmd+Z) reverses last action
- [x] Redo (Ctrl+Shift+Z / Cmd+Shift+Z) re-applies
- [x] Works for: place, delete, rotate
- [ ] **UI buttons for undo/redo** (needed for future tablet/phone use) → FIX PRIORITY 6

## Save/Load

- [ ] **Save actually persists across browser reload** — BROKEN → FIX PRIORITY 2
- [ ] **Named saves** (prompt for name, list to choose from) → FIX PRIORITY 2
- [ ] **New Design button** (clear all parts with confirmation) → FIX PRIORITY 2
- [ ] Saved design preserves all part positions, rotations, and connections

## UI Buttons for Keyboard Shortcuts

- [ ] **Rotate X / Y / Z buttons** (shown during connector placement/selection) → FIX PRIORITY 6
- [ ] **Delete button** (shown when part is selected) → FIX PRIORITY 6
- [ ] **Undo / Redo buttons** → FIX PRIORITY 6

## Verification Test

- [ ] Can build a simple cube (8 connectors + 12 tubes) — blocked by 3D snap bug + missing 3-way spatial connector
- [ ] ~~Can build a structure with diagonal connectors~~ — deferred
- [ ] ~~Can build a structure using both 15 cm and 35 cm tubes~~ — deferred
- [x] Structures look correct from all camera angles
- [ ] Save, reload browser, load — design is intact — blocked by save/load bug

---

## Fix Priority Summary

| Priority | Issue | Type |
|---|---|---|
| 1 | 3D snapping (connectors on vertical tubes) | BLOCKER |
| 2 | Save/load persistence + named saves + New Design | BLOCKER |
| 3 | Add 3-way spatial connector | HIGH |
| 4 | Instant rotation preview (remove animation) | HIGH |
| 5 | Coordinate system indicator | MEDIUM |
| 6 | UI buttons for all keyboard shortcuts | MEDIUM |

## Deferred to Phase 2

- Tube 15 cm
- 4-way spatial connector (5-way suffices)
- Diagonal connector (135°)
- Panels, double tube connectors
- Moving attached parts when rotating placed connector
- Orientation picker dialog (UX improvement)

---

## Known Issues / Bugs

1. Cannot attach connectors to vertical tube ends (horizontal only)
2. Save/load does not persist across browser reload
3. Rotation preview has animation delay instead of instant snap
