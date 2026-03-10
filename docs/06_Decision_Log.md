# Decision Log

*Append-only document. Records key decisions with context and rationale. Never edited retroactively — new decisions override old ones.*

---

## 2026-03-10 | Project documentation structure

**Decision:** Split planning content into separate focused documents instead of one monolithic file.

**Rationale:** A single file becomes unwieldy fast. Separate documents allow independent updates and clearer navigation.

**Structure adopted:**
- `00_Idea.md` — Original idea and requirements (your input)
- `docs/02_Roadmap.md` — Phased plan with success criteria
- `docs/03_Tech_Stack.md` — Technology choices and rationale
- `docs/04_Competitive_Analysis.md` — Existing tools, evaluation checklist
- `docs/05_Business_Plan.md` — Monetization, costs, risks
- `docs/06_Decision_Log.md` — This file

---

## 2026-03-10 | No file versioning for planning documents

**Decision:** Planning documents are "living documents" — always overwritten to reflect the current state. No v1, v2, v3 copies.

**Rationale:** Version files (Plan_v1.md, Plan_v2.md) create clutter and confusion about which is current. Instead, the Decision Log captures the *reasoning* behind changes, providing traceability without file proliferation.

**Exception:** Code is versioned via Git, which handles this automatically and properly.

---

## 2026-03-10 | Platform: Web App (PWA)

**Decision:** Build as a web application, deployable as a Progressive Web App.

**Rationale:** Cross-platform from day one, fastest iteration cycle, one codebase, best AI code-gen support. Three.js performance is sufficient for Quadro's part count. Can be wrapped as a native mobile app via Capacitor later if needed.

**Alternatives considered:** Native desktop app, native mobile app, Electron app. All rejected due to higher complexity and slower iteration, with no significant benefit for this use case.

---

## 2026-03-10 | Tech stack: React + TypeScript + Vite + R3F

**Decision:** Use React, TypeScript, Vite, and React Three Fiber as the core stack.

**Rationale:** Largest ecosystem, best AI code generation support, type safety. R3F provides declarative 3D in React. Zustand for state management. Backend (Supabase) deferred to post-prototype.

**Status:** To be discussed in more detail before implementation.

---

## 2026-03-10 | No time estimates in roadmap

**Decision:** Remove all week/hour estimates from the roadmap. Define phases by scope and success criteria only.

**Rationale:** Too many unknowns: your adaptation speed to this workflow, AI tool effectiveness, technical complexity discoveries. Time estimates would be misleading. Success is measured by deliverables, not deadlines.

---

## 2026-03-10 | Development workflow: continuous, not waterfall

**Decision:** Each feature is implemented + tested + documented in one go. No separation of "development days" and "testing days."

**Rationale:** With AI-assisted development, the build-test-fix cycle is fast enough to be continuous. Separating these into different days wastes context and momentum.

---

## 2026-03-10 | Stability checks: basic = free, advanced = premium

**Decision:** Rule-based stability checks (height/width ratio, unsupported spans, ground contact) are part of the free tier. Simulation-based checks (FEM, regulatory compliance) are potential premium features.

**Rationale:** Basic safety information should not be paywalled — it's a user safety concern. Advanced simulation is genuinely more costly to compute and provides professional-grade value worth paying for.

---

## 2026-03-10 | Version control: GitHub from day one

**Decision:** Use GitHub from the start, not local-only Git with later migration.

**Rationale:** The setup effort difference is negligible (~5 min vs. ~2 min). Starting with GitHub provides cloud backup from day one, eliminates the risk of losing work if the laptop fails, and avoids the "I'll set it up later" gap. Deployment tools like Vercel connect directly to GitHub, making the path to production smoother.

**Alternative considered:** Start with local Git, migrate to GitHub later. Rejected because the total effort is actually higher (~7 min vs. ~5 min) and you lose cloud backup in the interim.

---

## 2026-03-10 | Development role distribution

**Decision:** Johanna is the project owner, architect, and tester. Claude Code writes the implementation. Cowork handles planning, review, and decisions.

**Context:** Johanna has strong programming fundamentals (C, C#, C++, Matlab, Python) but no web development or React experience. The goal is to understand the architecture at a meta level, not to write every line of code manually. Claude Code should include clear inline comments explaining architectural decisions so the codebase is readable and educational.
