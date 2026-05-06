# Changelog

## Summary
- Fixed the patient portal crash caused by a missing `Send` import.
- Added shared-state visibility for creations inside the patient detail view.
- Changed sharing to behave like a toggle so the same button can share and unshare.
- Updated the patient portal shared-creation card to offer a single `DESCARGAR` action backed by the existing PDF exporters.

## Decisions
- Kept the existing copy intact in the UI.
- Drove the shared indicator from the patient portal overview so the acompañamiento tab stays in sync.
- Invalidated patient portal cache keys after toggling share state.
- Reused the current client-side PDF generation flow instead of introducing a separate backend download path.

## Next
- If needed, the repo can be cleaned up further for whitespace and unrelated modified files, but I left those untouched.
