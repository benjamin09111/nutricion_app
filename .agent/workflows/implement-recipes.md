---
description: Implement the Recipes Module with Schedule and Meal Generation.
---

# Implement Recipes Module

1.  **Backend: Recipe Logic**
    - [ ] Create `Recipe` model (Name, Ingredients[], Steps).
    - [ ] **Auto-Generator**:
        - Input: `ShoppingListDraft` (Ingredients available).
        - Logic: Match ingredients to database of "Base Recipes" or use AI to generate instructions.
    - [ ] **Schedule**:
        - Store User's Schedule (Work 9-5, Sleep 11-7).
        - Algorithm to place meals (Breakfast @ 8am, Snack @ 11am, Lunch @ 1pm...).

2.  **Frontend: Recipe Scheduler**
    - [ ] **Configuration**: Set "Meals per day" (3-6) and "Lifestyle" (Sedentary, Active, Work hours).
    - [ ] **Visual Calendar/Timeline**: Show when each meal is recommended.
    - [ ] **Recipe Cards**: Show generated recipes for each slot.

3.  **Deliverable**
    - [ ] "Finalize": Bundles Diet + Shopping List + Recipes into one big PDF/Link.
    - [ ] Save to `MyCreations`.
