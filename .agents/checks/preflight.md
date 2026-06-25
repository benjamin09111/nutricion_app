# Pre-Flight Checklist

Before writing any code, you MUST run through these checks to ensure clinical and technical safety.

## 1. Requirement Clarity
- [ ] **Task Understanding**: Do I fully understand the clinical or administrative objective?
- [ ] **Glossary Alignment**: Have I checked `.agents/context/glossary.md` to identify if this is a **Sequential Flow** (Entregable Personalizado) or a **Standalone Module**?
- [ ] **Ambiguity Check**: If the request is vague or could affect multiple modules, have I asked for clarification?

## 2. Impact Mapping
- [ ] **File Identification**: Have I located all relevant files using `.agents/map/files.md`?
- [ ] **Dependency Audit**: Have I checked `.agents/rules/safety.md` for potential side effects in related modules?
- [ ] **Database Impact**: Will this change affect the Prisma schema or existing JSON data structures?

## 3. Standard Alignment
- [ ] **UI Reference**: Am I following the `/dashboard/pacientes` visual standard?
- [ ] **Tech Stack**: Am I using the approved libraries (TanStack Query, RHF, Zod) as defined in `.agents/context/tech.md`?

---
*Last updated: 2024-05-07*
