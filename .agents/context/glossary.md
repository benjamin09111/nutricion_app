# NutriNet Glossary & Domain Concepts

To ensure consistency and avoid functional confusion, the following definitions must be strictly followed when discussing or modifying clinical modules.

## 1. Clinical Flows (The Core Engines)

### Entregable Personalizado (Personalized Deliverable)
- **Concept**: A mandatory sequential 4-stage process to create a comprehensive clinical plan for a specific patient.
- **Nature**: Sequential and interdependent.
- **Stages**:
    1. **Dieta**: Strategic selection of foods and restrictions (`/dashboard/dieta`).
    2. **Recetas y Porciones**: Practical quantification and meal scheduling (`/dashboard/recetas`).
    3. **Carrito**: Automated shopping list generation based on steps 1 and 2.
    4. **Entregable**: Final professional export.
- **Entry Point**: `/dashboard/dieta`.

### Recetas y Porciones (Recipes & Portions)
- **URL**: `/dashboard/recetas`.
- **Role**: Stage 2 of the **Entregable Personalizado** flow.
- **AI Intelligence**: Uses AI to **autofill** missing portions and meal gaps based specifically on the foods selected in the previous **Dieta** stage.
- **Warning**: Its logic is unique and tightly coupled to the patient's selected diet strategy.

### Entregable Rápido (Quick Deliverable)
- **URL**: `/dashboard/rapido`.
- **Concept**: An independent, high-speed form for nutritionists who need to generate a plan without following the full 4-stage clinical flow.
- **AI Intelligence**: Assists in generating dish titles and basic content within the form.
- **Nature**: Standalone; separate from the sequential clinical engine.

### Recetas Rápido (Quick Recipes)
- **URL**: `/dashboard/rapido/recetas`.
- **Concept**: A dedicated module for generating full dishes and detailed recipes based on natural language instructions (e.g., "Give me 5 breakfast ideas with oats and apple").
- **Nature**: Can generate a standalone PDF or save artifacts to the library.
- **Differentiation**: This is NOT the same as "Recetas y Porciones". While the latter quantifies a diet, "Recetas Rápido" creates complete culinary creations from scratch.

## 2. Key Entities
- **Creation**: The database entity that stores the output of any of the above flows (Drafts or Final versions).
- **Project**: The container that orchestrates the **Entregable Personalizado** sequence.

---
*Last updated: 2024-05-07*
