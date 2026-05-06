# Plan: patient-creation-ui-compact

## Goal
Optimize the patient creation view (`CreatePatientClient.tsx`) to clearly identify mandatory vs optional fields and reduce vertical density to minimize scrolling.

## Scope
- Update all labels in `CreatePatientClient.tsx` with "(Obligatorio)" or "(Opcional)".
- Reduce margins, paddings, and heights of cards and inputs.
- Adjust the layout to be more compact.

## Steps
1. **Research**: Identify all labels and their required status.
2. **Implement**: 
    - Update labels.
    - Reduce `p-6` to `p-4` or `p-5`.
    - Reduce `space-y-6` to `space-y-4`.
    - Reduce input heights if appropriate.
    - Shrink the banner size.
3. **Verify**: Ensure the view is functional and visually consistent with the NutriNet standard.

## Verification Plan
- Visual inspection of the form.
- Ensure validation still works (Name and Email required).
- No regressions in data submission.
