# Phase 1 Prompt for Claude Code

Copy the text below into the Claude Code "Code" tab after selecting the Quadro_Designer folder.

See also: `./docs/Phase1_Checklist.md` for the full acceptance criteria.

---

Read the project context from ./00_Idea.md, ./docs/02_Roadmap.md, and ./docs/Phase1_Checklist.md first. Then:

## Step 1: Project Setup
- Create a new React + TypeScript + Vite project in a subfolder called `app/`
- Install React Three Fiber (@react-three/fiber), Three.js, @react-three/drei, and Zustand
- Initialize a Git repository
- Create a GitHub repository called "quadro-designer" and push the initial code
- Verify the dev server starts and shows a blank page in the browser

## Step 2: Proof-of-Principle — 3D Climbing Frame Designer

Build a minimal but functional 3D designer with these features:

### Parts (generated as parametric Three.js geometry)
- **Tube 35 cm:** cylinder, 35 cm length, 5 cm diameter
- **Tube 15 cm:** cylinder, 15 cm length, 5 cm diameter
- **Connectors:** generate these types programmatically:
  - Elbow (2-way, 90°)
  - T-connector (3-way, flat — Flächenkupplung)
  - Cross connector (4-way, flat — all in one plane)
  - 3-way spatial connector (Raumkupplung 3-armig — ports in 3D, not flat)
  - 4-way spatial connector (Raumkupplung 4-armig — ports in 3D, not flat)
  - Diagonal connector (2-way, 135° angle — Winkelkupplung)
- Each connector has clearly visible open ports where tubes can attach
- Parts don't need realistic colors or textures — simple solid colors to distinguish types are fine

### 3D Viewport
- Orbit, zoom, and pan camera controls (use @react-three/drei OrbitControls)
- A ground grid for spatial reference
- Reasonable default camera position and lighting

### Connector Rotation (CRITICAL FEATURE)

This is essential — without rotation, you can't build anything useful.

**Before placement / during preview:**
- The selected connector can be rotated around X, Y, and Z axes in 90° steps
- Use keyboard shortcuts (e.g., X/Y/Z keys to rotate around the corresponding axis) or UI buttons
- The preview in the 3D scene shows the connector in its current rotation before clicking to place

**After placement:**
- A placed connector with NO tubes attached: can be rotated freely (X, Y, Z in 90° steps)
- A placed connector with ONE tube on one axis: can only be rotated around that tube's axis (90° steps). Rotation must move all other attached parts correctly.
- A placed connector with tubes on 2+ different axes: rotation is locked (cannot rotate without breaking connections)

**Example:** An elbow connector placed flat (ports pointing right and forward) should be rotatable to point right+up, forward+up, left+down, etc. — all 90° increments. Once a tube is attached on the right port, you can only spin it around the right-left axis.

### Snap-to-Connector (CRITICAL FEATURE)
- When placing a tube near an open connector port, it highlights the valid snap point
- Clicking snaps the tube into place, aligned with the port direction
- Connectors placed near an open tube end snap onto the tube
- Invalid placements (occupied port, wrong angle) are prevented or clearly indicated
- Snap works correctly for all connector types and all rotation states

### Interaction
- A sidebar showing available parts (both tube sizes + each connector type)
- Click a part in the sidebar to select it
- Click in the 3D scene to place the selected part
- Click an existing part to select it (visual highlight)
- Delete selected parts (Delete/Backspace key)
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z or Cmd+Z / Cmd+Shift+Z)

### Save/Load
- Save the current design as JSON in browser localStorage
- Load a saved design (preserving all positions, rotations, and connections)
- Simple UI buttons for save/load

### Code Quality
- Include clear inline comments explaining architectural decisions and how key mechanics work (snap system, rotation logic, state management, scene graph)
- Structure the code in well-organized files/folders
- The code should be readable for someone with programming experience but new to React/TypeScript

## Verification Tests
Before finishing, verify these work:
1. Build a simple cube (8 connectors + 12 tubes) using rotation to orient connectors correctly
2. Build a structure with diagonal connectors (ramp shape)
3. Build something using both 15 cm and 35 cm tubes
4. Save the design, reload the page, load the design — everything intact
5. Undo/redo works for placement, deletion, and rotation

## Important Notes
- This is a proof-of-principle. The two critical features are **snap-to-connector** and **connector rotation**. Both must work reliably.
- Don't add features beyond what's listed above.
- Test that the app runs without errors before finishing.
- Commit and push to GitHub when done.
