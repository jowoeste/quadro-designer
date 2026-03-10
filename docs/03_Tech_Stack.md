# Tech Stack

*Living document — updated as decisions are made.*

---

## Platform: Web App (Progressive Web App)

### Why web?

- **Cross-platform from day one.** Works on Mac, Windows, tablets, phones. No app store approval.
- **Fastest to iterate.** Deploy changes instantly. No app review cycles.
- **One codebase.** Native would require separate codebases for iOS, Android, desktop.
- **3D is mature on the web.** Three.js has been production-ready for years. React Three Fiber makes it declarative.
- **Best AI support.** React/TypeScript have the strongest Claude Code support.
- **Lowest user barrier.** No installation. Share a link and they can start designing.

### Honest disadvantages

- **3D performance ceiling.** Native (Unity, Unreal) is faster for raw 3D. But for Quadro's part count (hundreds, not millions), web-based Three.js is more than sufficient.
- **Offline support is limited.** PWA offline works but is less robust than native. Acceptable for a design tool.
- **No app store visibility.** Matters only once business/distribution becomes a priority.

### Path to mobile app

The web app can become a phone app later via **Capacitor** (by Ionic). This wraps the existing web codebase into a native iOS/Android container, adding access to native features (push notifications, camera, etc.). Migration effort is typically days, not weeks. Many production apps use this path.

---

## Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + TypeScript | UI framework with type safety |
| **3D engine** | React Three Fiber + Three.js | Declarative 3D rendering in React |
| **3D helpers** | @react-three/drei | Pre-built camera controls, gizmos, snapping utilities |
| **State management** | Zustand | Lightweight state management, integrates well with R3F |
| **UI components** | shadcn/ui + Tailwind CSS | Professional-looking UI with minimal effort |
| **Build tool** | Vite | Fast development builds with hot-reload |

### Added later (not needed for prototype)

| Layer | Technology | Purpose |
|---|---|---|
| **Backend / DB** | Supabase | Auth, PostgreSQL database, file storage (generous free tier) |
| **Hosting** | Vercel or Netlify | Free tier, instant deploys from Git |
| **i18n** | react-i18next | Multi-language support (mechanical task for Claude Code) |
| **Physics** | Rapier (@react-three/rapier) | WASM-based physics for stability simulation |
| **Testing** | Vitest + Playwright | Unit tests + end-to-end browser tests |
| **Mobile wrapper** | Capacitor | Wrap web app as native iOS/Android app |

---

## Key Technology Explanations

### React + TypeScript
React is a UI library by Meta. TypeScript adds static types to JavaScript, catching bugs before they run. Together they're the most widely used frontend stack, meaning the best tooling, documentation, and AI code generation support. TypeScript will feel familiar coming from C# — it has similar static typing, interfaces, and generics.

### React Three Fiber (R3F)
A React renderer for Three.js. Instead of writing imperative 3D code, you write declarative React components. Example: `<mesh><boxGeometry /><meshStandardMaterial /></mesh>` renders a 3D box. This makes 3D scenes composable and maintainable.

### Three.js
The underlying 3D engine. Handles WebGL rendering, camera management, lighting, geometry, and interaction. R3F is a thin wrapper on top.

### @react-three/drei
A collection of ready-made R3F components: orbit camera controls, transform gizmos (move/rotate/scale handles), grid helpers, snap utilities, and more. Saves significant development time.

### Zustand
A tiny state management library. Stores the application state (which parts are placed, what's selected, inventory, etc.) in a way that's accessible from both React UI components and the 3D scene.

### Vite
A build tool that provides instant hot-reload during development. When you change code, the browser updates in milliseconds. Makes the development loop very fast.

---

## Your Development Profile

**Programming background:** C, C#, C++, Matlab, Python — strong fundamentals. The core concepts (types, functions, control flow, data structures) all transfer directly. TypeScript will feel natural after C#.

**New territory:** Web development (React, HTML/CSS, browser APIs), 3D web graphics (Three.js), Git version control, Node.js ecosystem. Claude Code handles the implementation details — your role is understanding the architecture, making design decisions, and testing.

**What this means in practice:** Claude Code will write the code, but it will include clear inline comments explaining *why* things are structured the way they are. You should be able to read and understand the code, even if you wouldn't write it from scratch yet. Think of it like reading a paper in a new field — you understand the logic even if you couldn't produce it yet.

---

## Version Control: GitHub from Day One

**Decision:** Use GitHub from the start (not local-only Git).

**Why not start local and migrate later?**

| Aspect | GitHub from day one | Local first, migrate later |
|---|---|---|
| Initial setup effort | ~5 min (Claude Code does it) | ~2 min (just `git init`) |
| Migration effort | — | ~5 min (create repo, push) |
| Total effort | ~5 min | ~7 min |
| Risk of losing work | Near zero (cloud backup) | Real (laptop dies = code gone) |
| Deployment later | One-click (Vercel connects to GitHub) | Need to set up GitHub first anyway |
| History before migration | Full history on GitHub | History exists locally but not backed up |

The migration itself is trivial — the difference is about 2 minutes. But starting with GitHub gives you cloud backup from day one and avoids the "I'll do it later" gap where your only copy lives on one machine. Claude Code can set up the entire GitHub workflow for you.

**What is Git/GitHub in practice?** Git tracks every change you make to the code, like unlimited undo with labels. GitHub is a website that stores a copy of your Git repository in the cloud. Every time you finish a feature, you "commit" (save a checkpoint) and "push" (upload to GitHub). If anything goes wrong, you can always go back to any previous checkpoint.

---

## Development Environment Setup

Everything below will be installed and configured by Claude Code in your first session. Listed here so you know what's coming.

### What needs to be installed on your Mac

1. **Homebrew** — Package manager for macOS (like apt on Linux). Used to install everything else.
2. **Node.js** (via Homebrew) — JavaScript runtime. Required to run the development server and build tools.
3. **Git** (via Homebrew) — Version control. May already be installed on your Mac (Xcode command line tools include it).
4. **VS Code** — Code editor. Download from code.visualstudio.com.
5. **Claude Code** — CLI tool for AI-assisted development. Installed via npm (Node.js package manager).

### VS Code extensions (installed automatically)

- ESLint — catches code errors
- Prettier — auto-formats code
- TypeScript support — built into VS Code

### GitHub account

You'll need a free GitHub account (github.com). If you don't have one yet, create it before the first Claude Code session.

### First Claude Code session will

1. Install Homebrew, Node.js, Git (if not present)
2. Configure Git with your name and email
3. Create the project with Vite + React + TypeScript + R3F
4. Initialize Git, create GitHub repo, push initial code
5. Run the development server — you should see a blank 3D scene in your browser

**Estimated time:** 15-30 minutes for full setup, then straight into Phase 1 development.
