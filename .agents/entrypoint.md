# NutriNet AI Entrypoint (Token-Efficient)

Act as Senior Fullstack Dev. Policy: Lazy Load only.

## 1. Core Routing (Always On — MANDATORY)
- **Agent Identity**: `/.agents/agents.md` (Identity, golden rules, memory protocol)
- **Agent Memory**: `/.agents/memory.md` (Cross-session learning — READ at start, WRITE automatically)
- **Dev Rules**: `/.agents/rules/development.md` (Code rules: reuse, organization, conventions)
- **Design Rules**: `/.agents/rules/design.md` (Visual rules: responsive, palette, components)
- **Map/Files**: `/.agents/map/files.md` (Project navigation)

## 2. On-Demand Skills (Load ONLY if needed)
- **UI/Forms**: `/.agents/skills/forms.md` (Tasks involving React/Forms)
- **Logic/API**: `/.agents/skills/api.md` (Tasks involving Fetch/React Query)
- **DB/Prisma**: `/.agents/skills/db.md` (Tasks involving Backend/Prisma)

## 3. Context & Workflows (Load ONLY for deep dives)
- **Domain**: `/.agents/context/glossary.md` | `/.agents/context/product.md`
- **Architecture**: `/.agents/context/architecture.md` | `/.agents/context/modules.md` | `/.agents/context/tech.md`
- **Workflows**: `/.agents/workflows/*.md`
- **Evolution**: `/.agents/evolution/decisions.md` | `/.agents/evolution/patterns.md`

INSTRUCTION: Always read agents.md, memory.md, rules/development.md, rules/design.md, and map/files.md on session start. Load other files only when the task requires them.
