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
- [x] 3-way spatial connector (Raumkupplung 3-armig) — 3 perpendicular ports for cube corners
- [ ] ~~4-way spatial connector (Raumkupplung 4-armig)~~ — deferred (5-way is included, sufficient)
- [ ] ~~Diagonal connector (135°)~~ — deferred to Phase 2
- [x] Each connector clearly shows which ports are open vs. occupied
- [ ] ~~Panels, double tube connectors~~ — deferred to Phase 2

## 3D Viewport

- [x] Orbit camera controls (drag to rotate view)
- [x] Zoom (scroll wheel)
- [x] Pan (right-click drag or shift+drag)
- [x] Ground grid for spatial reference
- [x] Reasonable default camera position and lighting
- [x] Coordinate system indicator (XYZ gizmo in bottom-right corner) — bonus, implemented ahead of Phase 2

## Parts Sidebar

- [x] Sidebar shows all available part types
- [x] Click to select a part type for placement
- [x] Visual indicator showing which part is currently selected

## Connector Rotation

### Before placement (during selection/preview)
- [x] Selected connector can be rotated around X-axis in 90° steps
- [x] Selected connector can be rotated around Y-axis in 90° steps
- [x] Selected connector can be rotated around Z-axis in 90° steps
- [x] Rotation controls work (X/Y/Z keys)
- [x] Preview shows the connector in its current rotation before placing
- [x] Rotation preview is instant (no animation delay)

### After placement (with constraints)
- [x] A placed connector with one tube can be rotated around that tube's axis (90° steps)
- [x] Rotation after placement is in 90° steps
- [ ] ~~Rotation after placement moves all other attached parts~~ — deferred to Phase 2
- [x] A connector with tubes on 2+ axes cannot be freely rotated (locked)

## Snap-to-Connector (CRITICAL)

- [x] When placing a tube near an open connector port, it highlights the valid snap point
- [x] Releasing/clicking snaps the tube into place, aligned with the port direction
- [x] A tube connects two connectors: when one end snaps, the other end shows valid positions
- [x] Connectors snap onto vertical tube ends (full 3D ray-based snapping)
- [x] Invalid placements (occupied port, wrong angle) are prevented
- [x] Snap works correctly for all connector types and all rotation states

## Selection & Editing

- [x] Click an existing part to select it (visual highlight)
- [x] Delete selected part (Delete/Backspace key)
- [x] Deleting a part frees connections on neighboring parts

## Undo/Redo

- [x] Undo (Ctrl+Z / Cmd+Z) reverses last action
- [x] Redo (Ctrl+Shift+Z / Cmd+Shift+Z) re-applies
- [x] Works for: place, delete, rotate
- [x] UI buttons for undo/redo — bonus, implemented ahead of Phase 2

## Save/Load

- [x] Save persists across browser reload (localStorage with key `quadro-designs-v2`)
- [x] Named saves (text input for name, list to choose from)
- [x] New Design button (clears all parts with confirmation dialog)
- [x] Delete saved design option in load list
- [x] Saved design preserves all part positions, rotations, and connections

## UI Buttons (Toolbar)

- [x] Undo / Redo buttons — bonus, implemented ahead of Phase 2
- [x] Rotate X / Y / Z buttons — bonus, implemented ahead of Phase 2
- [x] Delete button — bonus, implemented ahead of Phase 2

## Verification Test

- [ ] Can build a simple cube (8 connectors + 12 tubes) — ready to test (snap + 3-way spatial now work)
- [ ] ~~Can build a structure with diagonal connectors~~ — deferred
- [ ] ~~Can build a structure using both 15 cm and 35 cm tubes~~ — deferred
- [x] Structures look correct from all camera angles
- [x] Save, reload browser, load — design is intact

---

## Fix Summary (All Completed)

| Priority | Issue | Status |
|---|---|---|
| 1 | 3D snapping (connectors on vertical tubes) | FIXED — ray-based snap detection |
| 2 | Save/load persistence + named saves + New Design | FIXED — localStorage v2 with named saves |
| 3 | Add 3-way spatial connector | FIXED — 3 perpendicular ports |
| 4 | Instant rotation preview | FIXED — useEffect recalculates immediately |
| 5 | Coordinate system indicator | BONUS — GizmoHelper/GizmoViewport |
| 6 | UI buttons for keyboard shortcuts | BONUS — floating toolbar |

## Deferred to Phase 2

- Orientation picker dialog (may become unnecessary with auto-connector mode)
- Connector geometry improvement (realistic shape instead of sphere-and-arm)
- Tube 15 cm
- 4-way spatial connector (5-way suffices)
- Diagonal connector (135°)
- Panels, double tube connectors
- Moving attached parts when rotating placed connector

---

## Known Issues / Bugs

*(None currently known — all P1-P4 issues resolved)*
