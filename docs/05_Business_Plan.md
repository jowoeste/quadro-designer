# Business Plan

*Living document — commercial focus is secondary for now. Updated as the project evolves.*

---

## Context

The primary goal of this project is learning AI-assisted development, not commercial success. The business model is designed to be lightweight and activatable when/if the product gains traction.

---

## Monetization Ladder

Implemented step by step, only when it makes sense:

**1. Free tier (forever)**
Full designer, inventory management, basic stability checks (rule-based), save/load. This is the core product and the hook for user adoption. Basic stability checks belong here because they are essential for safety — users should not need to pay to know their design might tip over.

**2. Affiliate links**
Commission when users purchase missing parts through the app's "shopping list" links to the Quadro shop. Low implementation effort, natural fit within the user flow.

**3. Premium features (later)**
Candidates for paid features:
- AI-assisted design suggestions (beyond basic feature-based generation)
- Advanced stability checks: simulation-based (FEM), compliance with playground regulations (EN 1176 etc.)
- Professional build instructions (PDF export with exploded views)
- Priority access to community designs

**4. Quadro partnership**
If the app gains meaningful traction, approach Quadro about: official partnership, API access to their product catalog, co-marketing, or even white-label integration.

---

## Running Costs

| Item | Phase 1-3 (prototype) | Phase 4+ (deployed) |
|---|---|---|
| Supabase | Not needed | 0 EUR/month (free tier: 50k MAU) |
| Vercel / Netlify | Not needed | 0 EUR/month (free tier) |
| Domain | Not needed | ~12 EUR/year |
| **Total** | **0 EUR** | **~12 EUR/year** |

Costs scale only if the app exceeds free tier limits (>50k monthly active users), which would itself indicate commercial viability.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 3D snap-to-connector is harder than expected | High | High | Phase 1 exists to test this immediately |
| Quadro parts data hard to catalog | Medium | Medium | Start with subset; automate from docs where possible |
| .QDF format is proprietary | Medium | Low | Not needed for prototype; nice-to-have later |
| Scope creep | High | Medium | Strict phase discipline; prototype first |
| Quadro legal objection | Low | High | App adds value to their ecosystem; address naming/trademark before public launch |
| Three.js performance limits | Low | Medium | Quadro part count (hundreds) is well within browser capabilities |
