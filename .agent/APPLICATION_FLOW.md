# NutriNet - Application Flow & Architecture

This document outlines the complete data flow of the NutriNet application, focusing on the linear generation process (Core) and the supporting modules.

## 1. Core Philosophy
The application operates on two main modes:
1.  **Linear Flow (Wizard)**: A sequential process starting from a Diet Plan and ending in a complete Deliverable (Shopping List + Recipes). Data is passed as "Drafts" between stages.
2.  **Standalone/Module Mode**: Each module can be used independently (e.g., creating just a Shopping List from an external PDF or scratch).

---

## 2. Module Breakdown & Data Flow

### A. Alimentos (Foods) - The Foundation
This is the master database for the application. All other modules query this data.
*   **Tabs / Views**:
    1.  **General**: The master list of all approved foods (System DB).
    2.  **Favoritos**: Foods marked by the Nutritionist as "Priority". These appear first in recommendations.
    3.  **Creados**: Custom foods added by the Nutritionist. Private to their account.
    4.  **Eliminados**: Foods from the General list that the Nutritionist explicitly hides/removes (Soft Delete).
*   **Logic**:
    *   *Updates*: When the System DB updates, "General" updates automatically. User "Overrides" (Edits to General foods) are saved as copies in "Creados" or "Modified" pointers to preserve user preferences.

### B. Pacientes (Patients)
The CRM layer.
*   **Input**: Patient Details (Anthropometry, Pathologies, Preferences).
*   **Output**: `PatientId` context for all creations.
*   **History**: Every finalized generated artifact is logged here.

### C. Dieta (Diet) - Step 1
*   **Input**: `PatientId` + `FoodDatabase` (Filtered by Favorites & Deleted).
*   **Process**:
    1.  **Requirements**: Select Pathologies (Diabetes, etc.) -> Filters `FoodDatabase`.
    2.  **Selection**: Generate and adjust a base list of allowed foods.
    3.  **Validation**: Optional AI check for conflicts between selected foods and restrictions.
*   **Output**: `DietDraft` (JSON with restrictions + allowed food base).

### D. Recetas y Porciones (Recipes & Portions) - Step 2
*   **Input**: `DietDraft`.
*   **Process**:
    1.  **Meal Structure**: Defines stages (breakfast/lunch/dinner/snacks).
    2.  **Quantification**: Assigns portions and frequencies for each selected food.
    3.  **Dish Generation**: Generates dish ideas based on chosen ingredients and portions.
    4.  **Supplements/Substitutes**: Adds practical alternatives where needed.
*   **Output**: `RecipePortionDraft` (meal structure + portionized plan + ingredient hints).

### E. Carrito (Shopping List) - Step 3
*   **Input**: `DietDraft` + `RecipePortionDraft`.
*   **Process**:
    1.  **Aggregation**: Consolidates all required ingredients and total amounts.
    2.  **Projection**: Multiplies by weekly/monthly planning window.
    3.  **Editability**: Nutritionist can adjust items, quantities, and equivalents.
*   **Output**: `ShoppingListDraft` (categorized shopping list generated from previous stages).

### F. Mis Creaciones (Deliverable) - Final Step
*   **Input**: `DietDraft` + `RecipePortionDraft` + `ShoppingListDraft`.
*   **Process**:
    1.  **Merging**: Combines all drafts into a single, cohesive PDF/Web View.
    2.  **Finalization**: Marks the drafts as "Completed". Logs to `PatientHistory`.
    3.  **Storage**: Saved in "Mis Creaciones" dashboard.
*   **Actions**:
    *   **Share**: Send via Email/WhatsApp (Engagement Module).
    *   **Redownload**: Get the PDF again.
    *   **Clone**: Use this as a base for a new month.

---

## 3. Engagement & Support
*   **Feedback**: Direct line to Admins for bugs/requests.
*   **Recursos**: Educational library (PDFs, Videos) to attach to Deliverables.
*   **Engagement**:
    *   **Automations**: "Send Draft X to Patient Y via WhatsApp".
    *   **Reminders**: "Remind Patient Y to drink water at 10:00".

## 4. Technical Implementation Strategy
*   **Backend**: NestJS "Modular Monolith". Each module (Diet, Foods, etc.) is distinct but shares the Database.
*   **State**: "Drafts" are stored in a temporary/working state (`status: DRAFT`) in the DB until finalized (`status: COMPLETED`).
*   **Frontend**: Next.js App Router. Each module is a route `/dashboard/module`. Context is maintained via URL interaction or LocalStorage for the Wizard flow.
