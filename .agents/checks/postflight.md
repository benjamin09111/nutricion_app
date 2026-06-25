# Post-Flight Checklist

Before marking the task as complete, verify your work against these NutriNet quality standards.

## 1. Scope & Integrity
- [ ] **Minimal Changes**: Did I modify ONLY the files strictly necessary for the task?
- [ ] **Behavior Preservation**: Does the existing system behavior remain 100% identical?
- [ ] **No Unsolicited Changes**: Did I avoid renaming entities, moving files, or refactoring unrelated code?

## 2. Quality & Standards
- [ ] **UTF-8 Protection**: Did I verify that no Spanish characters (`ñ`, tildes) were corrupted? (Look for `Ã` artifacts).
- [ ] **Spanish UI**: Is all user-facing text correctly written in Spanish with professional clinical tone?
- [ ] **Visual Consistency**: Does the new UI maintain the "Light Mode Only" palette (Indigo/Green/Ivory) and use `cursor-pointer`?

## 3. Technical Verification
- [ ] **Console/Log Check**: Are there any new errors or warnings in the browser console or server logs?
- [ ] **Clean Code**: Is the code modular, clean, and documented with clear English comments?
- [ ] **Performance**: Did I optimize DB queries (no N+1) and avoid expensive frontend re-renders?

## 4. Documentation
- [ ] **Session Closure**: If a `.collab` session was active, have I updated the `walkthrough.md` and `changelog.md`?

---
*Last updated: 2024-05-07*
