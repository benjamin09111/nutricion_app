# Walkthrough: update-nutria-chat-text

## Changes
- Updated the "Nutria" assistant message for the Dashboard module.
- Removed the text label "Pregúntale a la nutria" that appeared next to the chat widget to save space.
- Added a new step to the `introBeta` tutorial explaining that the Nutria assistant is available in the bottom-right corner.
- Added a new step to the `introBeta` tutorial about profile management and password changes in "Perfil y Configuración".
- Updated the first step of the `introBeta` tutorial with a clear warning about the beta status and potential calculation errors.
- Disabled ALL automatic tutorials (introBeta and module-specific) for users with administrative roles to ensure a distraction-free management experience.
- Added a safety check for `isAdminLoading` to prevent tutorials from flashing before the user role is confirmed.
- Fixed a bug where tutorials wouldn't trigger for nutritionists by adding role-related dependencies to the tutorial activation effects.
- Fixed a hydration error in `AdminContext.tsx` by deferred `localStorage` access to a `useEffect` hook, ensuring server and client renders match.
- Restricted Dark Mode application specifically to the `/dashboard` area. External pages like Login and Landing will now always render in Light Mode to maintain visual consistency.
- Fixed a "Rules of Hooks" violation by moving the early return after all hook declarations.
- Performed a cleanup of the database by removing test clinical restrictions, classification tags (including `testingProBenja`), and test metric definitions to prepare the environment for production use.
- Expanded Nutria assistant support:
    - Restricted visibility to allowed routes.
    - Added/Updated information for Patient Detail, Alimentos, Grupos, Detalles, Calculadora, and Información de Cálculos views.
- UI Robustness:
    - Fixed chat widget height with `max-h-[35rem]`.
    - Added `overflow-y-auto` to the message area to handle long content without breaking the screen layout.
    - Separated the message scroll area from the static input area.
    - Resolved a Turbopack build error by removing an extra closing `div` tag in the layout.
    - Improved message readability by adding spacing between bullet points.

## Evidence
- Code change in `NutriaChatWidget.tsx`:
    - Route messages updated for multiple modules.
    - Removed the conditional `<span>` for "Pregúntale a la nutria".
    - Added router check for specific route visibility.
    - Layout refactored to support scrollable messages and fixed input at the bottom.
- Code change in `introBeta.json`:
    - New step `intro-nutria` added before the final step.
