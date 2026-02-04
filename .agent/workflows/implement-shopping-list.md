---
description: Implement the Shopping List Module with Diet-to-List conversion and Price Estimation.
---

# Implement Shopping List Module

1.  **Backend: Shopping Logic**
    - [ ] Create `ShoppingList` model.
    - [ ] Endpoint `POST /shopping-list/generate`: Accepts `DietDraftId`.
    - [ ] Logic: Aggregate all foods from Diet, multiply by forecast days (e.g., 7 days).
    - [ ] **Price Estimator**: Mock logic or simple DB field `approxPrice` * quantity.

2.  **Frontend: Shopping View**
    - [ ] Display Generated List categorized by Aile (Dairy, Produce, Meat).
    - [ ] Allow manual adjustments (Add extra item, remove item).
    - [ ] Show "Estimated Total".

3.  **Output**
    - [ ] "Save Draft" -> Proceeds to Recipes.
    - [ ] "Export PDF" / "Send to Patient".
