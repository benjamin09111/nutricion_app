# Plan: fix-encoding-mojibake

**Date:** 2026-05-06
**Author:** Antigravity
**Mode:** TURBO

## Goal
Fix all character encoding issues (mojibake) in the codebase, specifically targeting Spanish special characters (á, é, í, ó, ú, ñ, ¡, ¿) that have been corrupted (e.g., Ã¡, Ã³, ÃƒÂ³, etc.).

## Scope
- Frontend and Backend source files identified via grep.
- Focus on user-facing strings and logs.
- Restore proper Spanish UTF-8 characters.

### In Scope
- `frontend/src/app/dashboard/dieta/DietClient.tsx`
- `frontend/src/app/dashboard/entregable/DeliverableClient.tsx`
- `frontend/src/app/dashboard/carrito/CartClient.tsx`
- `backend/src/modules/support/support.controller.ts`
- `backend/src/modules/recipes/recipes.service.ts`
- `backend/src/modules/mail/mail.service.ts`
- `backend/src/modules/creations/creations.service.ts`
- `backend/src/modules/patient-portals/patient-portals.service.ts`

### Out of Scope
- Functional changes.
- Layout changes.

## Research
- **KIs read:** N/A
- **Skills loaded:** collaborative-dev
- **Files to modify:** See scope.

## Implementation Plan

1. **Step 1: Fix Frontend Files**
   - Correct mojibake in `DietClient.tsx`, `DeliverableClient.tsx`, `CartClient.tsx`.
   - Pattern: `Ã¡` -> `á`, `Ã³` -> `ó`, etc.

2. **Step 2: Fix Backend Files**
   - Correct mojibake in `recipes.service.ts`, `mail.service.ts`, `support.controller.ts`, etc.
   - Pattern: `ÃƒÂ­` -> `í`, `ÃƒÂ³` -> `ó` (double encoding).

3. **Step 3: Verify**
   - Visual check of the changes in the code.
   - Ensure UTF-8 is maintained.

## Verification Plan
- Inspection of modified lines.
- No compilation errors.
