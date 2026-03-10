# Product Roadmap

*Living document — always reflects the current plan. See Decision Log for change history.*

---

## Success Criteria (per Phase)

**Phase 1 — Proof-of-Principle:** You can build a simple climbing frame (3+ tubes, multiple connectors) in the browser with snap-to-connector working.

**Phase 2 — Full Designer:** You can design your own kids' climbing frame using your actual Quadro parts, constrained to your inventory.

**Phase 3 — Feature-Based Design:** The app suggests climbing frame designs based on selected features (e.g., "playhouse + ladder") and available parts.

**Phase 4+ — Future Steps:** To be defined based on knowledge gained in Phases 1-3.

---

## Phase 1: Proof-of-Principle

**Goal:** A working web app where you can place tubes and connectors in 3D, snap them together, orbit the camera, and build simple climbing frame structures.

**Scope:**

- Project setup (React + TypeScript + Vite + R3F)
- A minimal parts set: 1 tube type (35 cm) + 3-4 connector types (elbow, T, cross, 5-way)
- Parts generated programmatically (Three.js geometry — cylinders for tubes, custom shapes for connectors). No external 3D files needed.
- 3D viewport with orbit/zoom/pan controls
- Click-to-place: select a part from a sidebar, click in the 3D scene to place it
- **Snap-to-connector mechanic:** bringing a tube near an open connector port snaps it into place. This is the critical technical risk.
- Undo/redo
- Save/load designs to browser local storage (JSON)

**Explicitly out of scope:**

- Colors, textures, realistic rendering
- Full parts catalog
- Inventory management
- Stability checks
- Backend, user accounts, deployment
- Mobile optimization

**Deliverable:** Open a browser, see a 3D workspace, pick parts from a sidebar, and build a simple climbing frame by clicking and snapping parts together.

**Part creation approach:** Claude Code generates parametric Three.js geometry. If STL files become available from the Quadro modeller (see Competitive Analysis), they can be imported later as an upgrade.

---

## Phase 2: Full Designer Functionality

**Goal:** A complete design tool usable for planning your own climbing frame.

**Scope:**

- Extend parts catalog to all Quadro parts
  - Preferred: automated from specifications or STL files
  - Fallback: manual specification only if automation fails
- Inventory management ("My Parts"):
  - Select parts you own
  - One-click loading of predefined packages
  - Automate package definitions from Quadro product documentation where possible
  - Add/remove individual parts
- Constrained design mode:
  - Designer restricts placement to parts in "My Parts"
  - Visual indicator for unavailable parts
  - Shopping list of missing parts
- Improved UX: better selection, rotation, deletion, moving of placed parts

**Deliverable:** Load the Quadro package(s) you own and design a full climbing frame restricted to those parts.

---

## Phase 3: Feature-Based Design

**Goal:** Users select desired features and the app generates design suggestions.

**Scope:**

- Define 2-3 initial features (e.g., playhouse, ladder, platform)
- Template sub-assemblies for each feature
- Automatic combination: selected features + available parts → 1-2 valid designs
- Extend to combining 2 features in one design
- Basic stability checks (rule-based):
  - Base width vs. height ratio
  - Maximum unsupported horizontal span
  - Ground contact requirements

**Deliverable:** Select "I want a playhouse with a ladder," click generate, and get a buildable design from your parts.

---

## Phase 4+: Future Steps

*To be planned with more knowledge after completing Phases 1-3. Current ideas:*

- Database of predefined / community models
- Extended stability checks (simulation-based — potential premium feature)
- Extended feature library
- Import from Quadro Model Database (.QDF)
- Deployment, user accounts, sharing
- Mobile optimization / Capacitor wrapper
- Affiliate links and monetization
- Multi-language support (react-i18next)
- App naming and branding
- Step-by-step build instructions
- PDF export of designs and parts lists
