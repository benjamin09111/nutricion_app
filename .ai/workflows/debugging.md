# Workflow: Debugging & Issue Resolution

Use this workflow to identify and resolve bugs while maintaining system integrity.

## 1. Reproduction & Isolation
- **Reproduce the Issue**: Clearly define the steps to trigger the bug.
- **Trace the Layer**: Identify if the failure is in the Frontend (UI/State), Backend (Logic/DTOs), or Database (Prisma/Schema).
- **Check the Logs**: Review console outputs and server logs to find error messages.

## 2. Root Cause Analysis
- **Focus on the Cause, Not the Symptom**: Investigate why the data is corrupted or the UI is failing, rather than just patching the visible error.
- **Data Audit**: For clinical errors, inspect the `Json` fields in the database (e.g., `Creation.content`) to ensure the source data is correct.

## 3. Minimal Fix
- **Targeted Patch**: Implement the smallest fix necessary to resolve the root cause.
- **Follow Coding Rules**: Ensure the fix follows the standards in `.ai/rules/coding.md`.

## 4. Side Effect Verification
- **Audit Dependencies**: Consult `.ai/rules/safety.md` and map out dependencies to ensure the fix doesn't break other parts of the clinical flow.
- **Regression Testing**: Verify that sequential steps (e.g., Dieta -> Recetas) still function correctly after the fix.

---
*Last updated: 2024-05-07*
