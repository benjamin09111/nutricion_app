# Changelog: fix-encoding-global

## Summary
Resolved global character encoding (mojibake) issues in the frontend codebase. Spanish text now displays correctly with proper accents and special characters.

## Decisions
- Used a recursive script to clean the entire `frontend/src` directory at once to ensure consistency.
- Standardized on UTF-8 for all source files.

## What's Next
- Continue with UI refactors or feature development now that the text is clean.
