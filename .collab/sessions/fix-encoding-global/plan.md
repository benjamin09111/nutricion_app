# Plan: Fix Encoding Global

**Goal:** Resolve character encoding (mojibake) issues where Spanish characters (accents, ñ, etc.) are displayed as corrupted sequences (e.g., Ã©).

## Scope
- `CreatePatientClient.tsx`
- `DeliverableClient.tsx`
- `GruposClient.tsx`
- `configuraciones/page.tsx`
- Any other file in `frontend/src` containing corrupted characters.

## Steps
1. **Research**: Grep for corrupted character patterns (Ã, â).
2. **Implementation**: Use a automated script to replace all occurrences of corrupted sequences with correct UTF-8 Spanish characters.
3. **Verification**: Run grep again to ensure no corrupted characters remain.
4. **Cleanup**: Delete temporary scripts.

## Verification Plan
- `grep -r "Ã" frontend/src` -> Should return no results.
- `grep -r "â" frontend/src` -> Should return only intentional characters (if any).
