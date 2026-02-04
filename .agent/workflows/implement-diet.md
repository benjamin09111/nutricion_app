---
description: Implement the Core Diet Module with Requirements, Recommendations, and Templates.
---

# Implement Diet Module

1.  **Backend: Diet Logic**
    - [ ] Create `Diet` and `DietTemplate` models in Prisma.
    - [ ] Implement "Recommendation Engine":
        - Logic to filter `Food` table based on constraints (e.g., exclude "Sugar" if Diabetes).
        - Logic to calculate macros target based on Patient data.
    - [ ] Implement "Draft" system: Save in-progress state (`DietDraft`).

2.  **Frontend: Diet Wizard**
    - [ ] **Step 1: Requirements**: Form to select Pathology (Diabetes, etc.), Preferences (Vegan), Targets.
    - [ ] **Step 2: Base List**: Display auto-generated food list. Allow Add/Remove foods.
    - [ ] **Step 3: Structure**: Define meals (Breakfast, Lunch, etc.) and assign foods? (Or is this in Recipes?). *Clarification: Diet usually defines WHAT to eat, Recipes define HOW.*

3.  **Frontend: My Diets (Templates)**
    - [ ] Save current configuration as a Template.
    - [ ] Load from Template.

4.  **Integration**
    - [ ] "Next Step" button: Saves Diet Draft and redirects to Shopping List module.
