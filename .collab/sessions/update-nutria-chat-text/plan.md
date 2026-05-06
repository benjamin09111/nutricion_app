# Plan: update-nutria-chat-text

## Goal
Update the welcome message of the AI assistant ("Nutria") and improve its UI/UX.

## Scope
- Modify `NutriaChatWidget.tsx` to update messages, handle visibility, and fix layout issues.
- Update `introBeta.json` to include a step about the Nutria assistant.

## Steps
1. **Implement**: 
    - Replace the static message in `getCurrentModuleHelp` for the "Dashboard" case. (Done)
    - Remove the `<span>` containing "Pregúntale a la nutria". (Done)
    - Add a new step in `introBeta.json` explaining the Nutria assistant's role. (Done)
    - Restrict the `NutriaChatWidget` to appear only on allowed routes. (Done)
    - Update messages for specific modules (Patients, Alimentos, Grupos, Detalles, Calculadora, Porciones). (Done)
    - Fix chat widget height and add scrolling for long content. (Done)
2. **Verify**: Ensure the text matches the user's request exactly and the layout is stable.

## Verification Plan
- Check the code for the updated strings.
- Confirm visibility logic works for the specified routes.
- Verify scrolling behavior in the chat widget.
