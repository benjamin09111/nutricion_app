# NutriSaaS - Application Flow & Architecture

This document outlines the complete data flow of the NutriSaaS application, focusing on the linear generation process (Core) and the supporting modules.

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
    2.  **Calculation**: Auto-calculate macros/micros targets.
    3.  **Selection**: Generate a "Base List" of recommended foods.
    4.  **Customization**: Nutritionist edits the list using Templates or manual entry.
*   **Output**: `DietDraft` (JSON containing selected foods, quantities, and structure).

### D. Lista de Compras (Shopping List) - Step 2
*   **Input**: `DietDraft` (or Manual Import).
*   **Process**:
    1.  **Aggregation**: Consolidates foods from the Diet (e.g., "Oats" in Breakfast + "Oats" in Snack = Total Oats).
    2.  **Projection**: Multiplies by "Days" (e.g., Buy for 7 days or 15 days).
    3.  **Estimation**: Calculates approx. cost based on DB prices.
*   **Output**: `ShoppingListDraft` (Categorized list: Dairy, Meat, Produce).

### E. Recetas (Recipes) - Step 3
*   **Input**: `ShoppingListDraft` (Available Ingredients).
*   **Process**:
    1.  **Matching**: Finds/Generates recipes that *only* use ingredients from the Shopping List (or common pantry items).
    2.  **Scheduling**:
        *   User defines **Lifestyle** (Work 9-18, Sleep 23-07).
        *   User defines **Frequency** (3 to 6 meals).
        *   System slots recipes into specific times (Breakfast 08:00, Lunch 13:00).
*   **Output**: `RecipePlanDraft`.

### F. Mis Creaciones (Deliverable) - Final Step
*   **Input**: `DietDraft` + `ShoppingListDraft` + `RecipePlanDraft`.
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
