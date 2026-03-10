# Phase 1 Prompt for Claude Code

Copy the text below into the Claude Code "Code" tab after selecting the Quadro_Designer folder.

---

Read the project context from ./00_Idea.md and ./docs/02_Roadmap.md first. Then:

## Step 1: Project Setup
- Create a new React + TypeScript + Vite project in a subfolder called `app/`
- Install React Three Fiber (@react-three/fiber), Three.js, @react-three/drei, and Zustand
- Initialize a Git repository
- Create a GitHub repository called "quadro-designer" and push the initial code
- Verify the dev server starts and shows a blank page in the browser

## Step 2: Proof-of-Principle — 3D Climbing Frame Designer

Build a minimal but functional 3D designer with these features:

### Parts (generated as parametric Three.js geometry)
- **Tube:** cylinder, 35 cm length, 5 cm diameter. One type only for now.
- **Connectors:** generate these types programmatically:
  - Elbow (2-way, 90°)
  - T-connector (3-way)
  - Cross connector (4-way, all in one plane)
  - 5-way connector (4 in one plane + 1 vertical)
- Each connector has clearly visible open ports where tubes can attach
- Parts don't need realistic colors or textures — simple solid colors to distinguish types are fine

### 3D Viewport
- Orbit, zoom, and pan camera controls (use @react-three/drei OrbitControls)
- A ground grid for spatial reference
- Reasonable default camera position and lighting

### Interaction
- A sidebar showing available parts (tube + each connector type)
- Click a part in the sidebar to select it
- Click in the 3D scene to place the selected part
- **Snap-to-connector:** when placing a tube near an open connector port, it snaps and attaches automatically. This is the most critical feature — spend extra effort getting this right.
- Click an existing part to select it (visual highlight)
- Delete selected parts
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z)

### Save/Load
- Save the current design as JSON in browser localStorage
- Load a saved design
- Simple UI buttons for save/load

### Code Quality
- Include clear inline comments explaining architectural decisions and how key mechanics work (snap system, state management, scene graph)
- Structure the code in well-organized files/folders
- The code should be readable for someone with programming experience but new to React/TypeScript

## Important Notes
- This is a proof-of-principle. Prioritize the snap-to-connector mechanic working correctly over polish.
- Don't add features beyond what's listed above.
- Test that the app runs without errors before finishing.
- Commit and push to GitHub when done.
