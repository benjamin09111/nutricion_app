# Workflow: Standard Task Execution

Follow these steps for every coding task in NutriNet to ensure clinical precision and system stability.

## 1. Contextual Understanding
- **Analyze the Request**: Determine if the task relates to a clinical module (Diet, Recipes, Shopping List) or a support module.
- **Consult the Glossary**: Read `.agents/context/glossary.md` to identify if you are working on a **Sequential Flow** (Entregable Personalizado) or a **Standalone Module**.

## 2. Technical Mapping
- **Locate Files**: Use `.agents/map/files.md` to identify the relevant frontend components and backend services.
- **Read & Analyze**: Examine the identified files. Do not assume behavior; verify it in the code.

## 3. Planning & Approval
- **Propose a Plan**: Outline a concise strategy for the change.
- **Align with .collab**: If a collaborative session is active, ensure the plan is documented in `.collab/sessions/<name>/plan.md`.

## 4. Implementation
- **Minimal Edits**: Apply the smallest possible change to solve the problem. Avoid large-scale modifications.
- **Reuse Components**: Use existing UI components and backend services. Do not reinvent established patterns.

## 5. Verification
- **Manual Check**: Verify functionality.
- **UTF-8 Integrity**: Ensure NO corruption of Spanish characters (`ñ`, tildes).
- **Regression Check**: Confirm NO impact on unrelated clinical steps.

## 6. Evolution (Learning)
- **Pattern Check**: Did a new technical pattern emerge? -> Create proposal in `/.agents/evolution/proposals.md`.
- **Feedback**: Did you repeat a mistake? -> Log it in `/.agents/feedback.md`.
- **Do NOT** update core rules directly; always wait for USER approval on proposals.

---
*Last updated: 2024-05-07*

