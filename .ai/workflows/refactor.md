# Workflow: Code Refactoring

Refactoring is a high-risk activity in a clinical system. Follow these rules strictly.

## 1. Explicit Authorization
- **Only When Requested**: Never perform unsolicited refactors. Only refactor when the user explicitly asks for code cleanup or architectural improvements.

## 2. Scope Definition
- **Identify Boundaries**: Map out the exact scope of the refactor.
- **Consult the Glossary**: Ensure you understand the distinction between sequential clinical logic and standalone features (`.ai/context/glossary.md`).

## 3. Behavioral Integrity
- **Identical Behavior**: The functionality must remain 100% identical after the refactor. No "stealth" feature additions or changes.
- **Test Before & After**: If tests exist, run them. If not, perform a thorough manual audit of the clinical flow before committing changes.

## 4. Incremental Execution
- **Step-by-Step**: Refactor in small, manageable increments rather than rebuilding large modules at once.
- **Check for Regressions**: Verify stability after each small change.

---
*Last updated: 2024-05-07*
