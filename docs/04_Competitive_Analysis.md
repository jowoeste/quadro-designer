# Competitive Analysis

*Living document — updated as new information is gathered.*

---

## Quadro's Own Tools

### What we know (from public sources)

Quadro offers two tools:

1. **QUADRO 3D Software** — A downloadable desktop application (Windows only, ZIP, 1.49 MB). Uses a proprietary .QDF file format. Available at quadrotoys.com/pages/downloads.

2. **QUADRO Model Database (MDB)** — An online catalog at quadromdb.com with hundreds of community designs. Each design can be viewed in 360 degrees and comes with printable building instructions and a downloadable .QDF file.

### What we don't yet know

**Action required:** Download and evaluate the QUADRO 3D Software. Use the evaluation checklist below.

### Evaluation Checklist

#### Functionality
- [ ] What parts are available? (List types: tubes, connectors, panels, slides, etc.)
- [ ] Are there different tube lengths or only 35 cm?
- [ ] How many connector types exist? (Count and describe)
- [ ] Are accessories (panels, slides, platforms) included?
- [ ] Can you design freely or only modify predefined models?
- [ ] Is there snap-to-connector functionality? How does it work?
- [ ] Can you rotate parts? In which increments?
- [ ] Is there undo/redo?

#### File Formats & Export
- [ ] Open a .QDF file in a text editor — is it readable (XML, JSON) or binary?
- [ ] Can you export to standard formats (STL, OBJ, GLTF, STEP)?
- [ ] Can you export a parts list / bill of materials?
- [ ] What is the file size of a typical design?

#### Inventory & Packages
- [ ] Can you select which package you own?
- [ ] Does it track available vs. used parts?
- [ ] Can you add individual parts?

#### Usability
- [ ] How intuitive is the software for a non-technical user?
- [ ] What are the most frustrating aspects?
- [ ] What works surprisingly well?
- [ ] How long does it take to build a simple structure (e.g., a cube)?

#### Stability & Safety
- [ ] Does it check for structural stability?
- [ ] Does it warn about unsafe designs?

#### Screenshots
- [ ] Take screenshots of: the interface, a design in progress, export options, the parts palette.

---

## BrickLink Studio (LEGO)

**What it is:** Desktop CAD software specialized for LEGO. The gold standard for modular construction toy design tools.

**Platform:** Windows and macOS only. No web, no mobile, no Linux.

**Key features:**
- Complete LEGO parts library (~30,000 elements)
- Photorealistic rendering
- Marketplace integration (buy missing bricks directly)
- Instruction maker (generates step-by-step build guides)
- Community model sharing

**History:** Started as an independent tool (Stud.io), acquired by BrickLink, which was then acquired by LEGO. Demonstrates the path from indie tool → official partnership.

**Relevance for us:**
- Being desktop-only is a competitive limitation we can avoid
- Parts inventory tied to purchasing is the most commercially valuable feature
- Instruction generation adds enormous practical value
- Community sharing drives engagement

---

## Mecabricks

**What it is:** A web-based LEGO designer.

**Relevance:** Proves that browser-based 3D construction tools work. Uses WebGL (same underlying technology as Three.js). Demonstrates that our web-first approach is technically viable.

---

## Our Differentiation

If we compare Quadro Designer to existing tools, the gaps we fill are:

| Feature | Quadro 3D Software | BrickLink Studio | Quadro Designer |
|---|---|---|---|
| Platform | Windows only | Windows + Mac | Web (all platforms) |
| Inventory management | Unknown (to verify) | Via marketplace | Core feature |
| Stability checks | Unknown (to verify) | No | Planned (Phase 3+) |
| Feature-based suggestions | No | No | Core feature (Phase 3) |
| Purchase recommendations | No | Yes (LEGO only) | Planned |
| Free & no install | No (download) | No (download) | Yes |

*Note: "Unknown" items will be updated after the Quadro 3D Software evaluation.*
