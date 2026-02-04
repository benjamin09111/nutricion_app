---
description: Implement the Foods Module (Alimentos) with General, Favorites, Created, and Deleted tabs.
---

# Implement Foods Module

1.  **Backend: Create Food Entity & Service**
    - [ ] Update `schema.prisma` to include `Food` model with:
        - `id`, `name`, `calories`, `proteins`, `carbs`, `fats`, `vitamins`, `category`.
        - Relations: `createdBy` (User), `favoritedBy` (User[]), `deletedBy` (User[]).
    - [ ] Generate Prisma Client.
    - [ ] Create `FoodsModule`, `FoodsController`, `FoodsService` in `backend/src/modules/foods`.
    - [ ] Implement Endpoints:
        - `GET /foods`: With filters for (all, favorites, created, not-deleted).
        - `POST /foods`: Create new food (mark `createdBy` current user).
        - `PATCH /foods/:id`: Edit (if owner) or copy-on-write? (Define logic: usually Admin foods are read-only, User foods are editable).
        - `POST /foods/:id/favorite`: Toggle favorite.
        - `DELETE /foods/:id`: Soft delete (add to `deletedBy` list or set `isDeleted` if owned).

2.  **Frontend: Create Food Components**
    - [ ] Create `FoodList` component (Reusable table/grid).
    - [ ] Create `FoodItem` modal/slide-over for details and edit.
    - [ ] Create `CreateFoodForm` with validation (Zod).

3.  **Frontend: Implement Tabs in `/dashboard/alimentos`**
    - [ ] **General Tab**: Fetch all foods (excluding user's hidden ones). Show "Add to Favorites" button.
    - [ ] **Favorites Tab**: Fetch foods in `favoritedBy` relation.
    - [ ] **Created Tab**: Fetch foods where `createdBy == currentUser`.
    - [ ] **Deleted Tab**: Fetch foods where `deletedBy` includes currentUser (or `isDeleted` flag). Option to "Restore".

4.  **Integration & Testing**
    - [ ] Verify creation of a food appears in "Created".
    - [ ] Verify favoring a food appears in "Favorites".
    - [ ] Verify determining "General" list filters out "Deleted" ones properly.
