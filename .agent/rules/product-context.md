---
trigger: always_on
---

# Product Context & Domain Rules (NutriSaaS)

These rules are specific to the NutriSaaS project and its business domain.

## 1. Product Truth & Fidelity

- **Professional SaaS**: The product is for nutritionists, not a consumer diet app.
- **Clinical Support**: The system supports clinical judgment; it never replaces it.
- **Reviewable Automation**: All AI output must be editable/overridable.

## 2. Core Product Principles

- **Time Saving**: The main value metric. Reduce cognitive load.
- **Minimize**: Manual calculations, repetitive content, off-platform chat.
- **Favor**: Click-based workflows, templates, immediate outputs.

## 3. Automation Boundaries

- **Must**: Assist decision making, generate suggestions.
- **Must NOT**: Make medical decisions, hide calculations, apply changes automatically.
- **AI Output**: Must be traceable ("Suggested by AI") and editable.

## 4. Domain-Specific Rules (Nutrition)

- **Formulas**: Based on validated inputs (Harris-Benedict, etc).
- **Pathology**: Plans must be adjustable per pathology (renal, diabetes).
- **Chile-First**: Support local foods and brands initially.
- **Stock/Substitutions**: Changes require approval.

## 5. Patient Interaction

- **Reduce Messaging**: Use in-app assistants to handle questions.
- **Education**: Simple, contextual, embedded. Avoid long texts.

## 6. AI Usage Rules

- **Support Layer**: AI is not the authority.
- **Deterministic**: Where possible.
- **Explainable**: No black boxes.

## 7. Data & Integrity (Medical)

- **Sensitive Data**: Treat all nutritional data as sensitive/medical.
- **No Destructive Ops**: Without confirmation.
- **Reproducible**: Calculations must be consistent.

## 8. UX & Product Language

- **Spanish (LATAM)**: All UI/UX must be in Spanish.
- **Visual Identity**: MATCH EXISTING LOGIN STYLE.
  - **Vibe**: Clean, simple, attractive, friendly.
  - **Colors**: Strict adherence to the established palette (refer to existing Login).
  - **Portal UX**: High contrast, readable, no clutter. "Clear & Understandable" > "Flashy".
- **Workflow-Driven**: Prioritize speed and clarity.
- **Presets**: Prefer templates over free-form.
- **Patient Navigation**: Clicking a patient in any list MUST open a dedicated tab/page for that patient, showing their specific history and associated consultations.

## 9. System Modules Scope (AI Agents)
All modules are designed as **Autonomous Agents** that interact with each other via events.

1.  **Diet Generation Agent**: Constraint-based + AI (PDF parsing).
2.  **Smart Shopping List Agent**: Auto-generated, categorized.
3.  **Favorite Foods Agent**: Priority logic for preferred items.
4.  **Chemical Composition Agent**: Automated nutritional calculation.
5.  **Patient CRM Agent**: History, anthropometry, progress.
6.  **Dish Generator Agent**: Recipe creation & timing.
7.  **Schedule Optimizer Agent**: Lifestyle-based meal timing.
8.  **Visual Guides Agent**: Educational output generation.
9.  **E-commerce Agent**: (Future) Shopping integration.
10. **Food Catalog Agent**: Master database with filters.
11. **Food Prices Intelligence Agent**: Chilean regional prices by week/sector.
12. **Engagement Bot Agent**: WhatsApp/Push automation.

## 10. Data Dictionary: Food Prices (Chile)
This data is sourced from Chilean market monitoring (Excel).
- **Anio**: Year of capture.
- **Mes**: Month of capture.
- **Semana**: Week of capture.
- **Fecha inicio**: Monday of the capture week.
- **Fecha termino**: Friday of the capture week.
- **ID region**: ISO Region code.
- **Region**: Region name.
- **Sector**: Sector name.
- **Tipo de punto monitoreo**: Type of establishment.
- **Grupo**: Product group.
- **Producto**: Product name (Species|Variety|Quality for fruits/veggies).
- **Unidad**: Commercial unit.
- **Precio minimo**: Min price in CLP.
- **Precio maximo**: Max price in CLP.
- **Precio promedio**: Avg price in CLP.

## 11. Strategic Vision & Commercial Goals

### Vision
To become the leading SaaS platform for Nutritionists in LATAM and eventually globally, revolutionizing the clinical workflow through automation, local market intelligence, and premium UX.

### Growth Strategy (The "Antigravity" Plan)
1.  **Phase 1: Validation & Niche Dominance (Chile)**
    *   Focus on solving the "local pain" (Chilean prices, local brands, local regulations) better than any global competitor.
    *   Target: Freelance Nutritionists & Small Consultancies.
    *   Value Prop: "The only software that knows what's in the Chilean supermarket."

2.  **Phase 2: B2B Expansion (High Volume)**
    *   Target: Clinics, Hospitals, Health Centers (Centros de Salud).
    *   Model: Volume Licensing / Enterprise Contracts.
    *   Feature Focus: Team collaboration, patient data security (HIPAA/GDPR equivalent), advanced reporting.

3.  **Phase 3: Ecosystem & Alliances (Affiliate/Data)**
    *   **Retail Integration**: Partner with Supermarkets (Lider, Jumbo, Cornershop) to convert "Shopping Lists" into "One-Click Orders". Revenue share model.
    *   **Data-for-Traffic Alliance**: Secure catalog API access in exchange for driving professional-approved traffic to their stores.
    *   **Pharma/Supplements**: Contextual recommendation engine for partners.

4.  **Phase 4: Global Scaling**
    *   Architecture designed for multi-region support.
    *   Expansion strategy: "Swap the Database" (Local Foods/Prices) -> Deploy in new country (Mexico, Spain, etc).
    *   Core logic remains identical; Data matches the locale.

5.  **Phase 5: The "Fitness & Supplements" Protocol (High Margin)**
    *   **Contextual Prescription**: Integrate Supplements (Whey, Creatine, Vitamins) directly into the Diet Wizard.
    *   **The "Gap Filler"**: AI suggests supplements specifically when nutritional targets (e.g., Protein) are hard to reach with food alone.
    *   **Verified Partners**: Brands pay to be the "Default Recommendation" or "Verified Choice" in the dropdowns.
    *   **Affiliate Ecosystem**: Patient clicks "Buy prescribed supplements" -> NutriSaaS gets % commission.

### Success Metrics
- **Professional Adoption**: Validated by user love ("My 3 nutritionists loved it").
- **Economic Scalability**: Recurring revenue (SaaS) + High-ticket B2B sales + Affiliate commissions.
- **Millionaire Mindset**: Every feature must justify its existence by either (1) saving massive time (Retention) or (2) generating new revenue streams (Growth). We build to win big.

## 12. Weekly Frequency Model (The "Time" Solver)
To solve the dilemma of "Monthly vs Daily" calculations, the system uses **Weekly Frequency** as the standard unit.
1.  **Selection**: User selects foods (Base Diet).
2.  **Assignment**: User assigns frequency (e.g., "Chicken: 3 times/week", "Salmon: 0.5 times/week" [bi-weekly]).
3.  **Calculation**: `(Portion) x (Weekly Freq) x 4 = Monthly Shopping List`.
4.  **Advantage**: Allows handling both daily staples and occasional foods efficiently without manual daily planning for 30 days.

## 13. Supplements "Power Drawer" (Commercial Core)
A dedicated, persistent sidebar/drawer for adding Supplements & Boosters to the plan.
-   **Location**: Always accessible during the "Recipe/Structure" phase.
-   **Smart Logic**: Suggests products based on nutritional gaps (e.g., "Protein low? Add Whey").
-   **Monetization**: Top suggestions are "Verified Partners" (Sponsored).
-   **Drag & Drop**: Users drag supplements into specific meal slots (e.g., Post-Workout).
-   **Integrity**: Adds to nutritional totals and Shopping List automatically.

## 14. Core Functional Modules Flow (The 4-Stage Engine)

### Stage 1: Dieta (The Strategy)
Creation of general base templates (e.g., "Vegan", "High Protein", "Low Cost").
- **Focus**: Basic structural restrictions and food selection.
- **Operation**: Define mandatory exclusions (Diabetic, Celiac, Allergic to X) and select allowed foods/favorites.
- **Educational Auto-Mapping**: Every selected constraint (Checkbox) automatically flags an educational module for the **Stage 4: Entregable**.
- **Custom Constraints**: Nutris can create their own specific constraints (e.g., "Diabético Tipo II"). If content is missing, AI generates reliable info with verified sources.
- **Reusability**: These are the "Master Strategy Templates" (JSON) without specific human quantities.

### Stage 2: Carrito (The Quantifier)
Conversion of the strategy into tangible quantities based on a specific human.
- **Patient Loading**: Import patient characteristics (Sex, Age, Height, Weight) AND personal tastes/dislikes (stored in CRM).
- **Quantification**: Calculates grams, portions, and total buy quantities (using Weekly Frequency).
- **Nutritional Intelligence**: Shows real-time totals (Calories, Protein, Vitamins) per Day, Week, and Month.
- **Optimization**: The Nutri can adjust quantities (e.g., 2kg -> 3kg) and the system updates the nutritional totals.
- **Hormonal Cycle Intelligence**: For female patients, the system can adjust macro-targets and food suggestions based on their menstrual cycle phase (e.g., increasing complex carbs/magnesium during the luteal phase).
- **Fitness Integration**: Add supplements or "fitness products" to fill gaps (Missing Proteins/Vitamins).
- **Financial Control**: View estimated spending; optimize by swapping expensive items for cheaper alternatives or supplements.
- **Supermarket Intelligence (Future)**: Option to select specific retailers (Lider, Jumbo, etc.) to fetch real-time prices. *Status: Locked/In Development*.
- **Cost-Benefit Intelligence**: Suggest the most efficient way to fill nutritional gaps. *Example*: "Missing 20g Protein: add 100g Chicken ($X) or 1 scoop Whey ($Y)?".
- **Substitutes**: Handle "Don't like X, use Y" logic based on patient profile.
- **Dynamic Equivalents**: In the Cart stage, the system suggests macro-equivalent swaps (e.g., Apple for Pear) based on price and availability, ensuring the plan remains elastic and cost-effective.

## 15. The "Híbrid" Philosophy
- **Total Control**: Every module is editable. Nutris can add/remove foods or change portions at ANY stage.
- **Dual Mode**:
    1. **Ultra-Fast**: Load template -> Load patient -> Instant tweak -> Export.
    2. **From Scratch**: Manual selection -> Automated quantification -> Export.
- **Context Awareness (The Semaphore)**: A real-time visual indicator (Red/Yellow/Green) that warns if protein (Red), calories, or critical vitamins (Yellow) are missing based on the patient's specific profile or targets.

## 16. Módulo Recursos (The Knowledge Base)
A centralized hub for the nutritionist's educational and marketing assets.
- **Personal Content**: Nutris can upload their own articles/blocks of text to be used in the "Entregable".
- **AI-Fallback**: If no custom content exists for a tag (e.g., "Microbiota"), the system generates it.
- **Communication Style (Tone of Voice)**: A dedicated section where Nutris define their "Vibe" (Clinical, Motivational, Empathetic). They can upload samples of their writing so the AI mirrors their specific way of speaking.
- **Nutrición Emocional & Hábitos**: A library of resources focused on mindful eating, psychological tips, and habit checklists (e.g., "Pausa consciente").
- **Marketing Section**: Tools for the nutri to manage their brand and professional communication (Future Phase).
- **General Info & Filters**: Searchable library of nutritional knowledge.
- **Precedence Rule**: If a Nutri has uploaded content for "Diabetes", it OVERRIDES common or AI-generated content in the final PDF.

### Stage 3: Recetas (The Implementation)
Generation of the daily/weekly eating plan using the Carrito's finalized data.
- **Practicality**: Create calendars, meal schedules, and specific dish ideas/recipes.
- **Nutrient Tracking**: Verify that daily targets (Protein/Calories) are met within the meal distribution (Breakfast, Lunch, Dinner).
- **Flexibility**: Adjustable number of meals and variety of plates.
- **Automation**: Automatic generator of dishes based on selected foods. The nutritionist can choose the number of meals per day, and the system automatically divides the portions.
- **Customization**: Ability to swap a specific meal (e.g., a specific lunch) for another recipe, allowing the nutri to choose between full automation or manual control ("capricho del nutri").
- **Emergency Jokers**: Pre-approved "quick/healthy" meal options (e.g., Tuna Bowl) using ingredients already in the Cart, for days when the patient cannot cook.

### Stage 4: Entregable (The Product)
A premium, personalized PDF guide for the patient.
- **Content Engine**: **Markdown (.md)** is the source of truth for all generated content. It bridges the AI Agent output with the final presentation layer (PDF/Canvas).
- **Structure**: Educational info (myths, advice), physical exercises, **Habit Checklists (Emotional Nutrition)**, the **Shopping List (Carrito)**, and the **Meal Plan (Recetas)** with horarios.
- **Tone Selection**: Nutris can toggle between communication styles (Formal, Close, Personalized) before exporting, ensuring the content matches their brand voice.
- **Zero-Friction QR**: Include a QR code that, when scanned, populates the shopping cart in partner retail apps (Líder/Jumbo/Cornershop) for one-click purchase.
- **Visual Branding (Canva-Style)**: Support for custom templates or pre-designed layouts. Nutritionists can use their own Canva-inspired designs.
- **Watermarking**: All exported PDFs will include a subtle "Powered by NutriSaaS" watermark.
- **Exclusion**: The "Dieta" technical configuration is hidden; the patient only sees actionable instructions.

## 15. The "Híbrid" Philosophy
- **Total Control**: Every module is editable. Nutris can add/remove foods or change portions at ANY stage.
- **Dual Mode**:
    1. **Ultra-Fast**: Load template -> Load patient -> Instant tweak -> Export.
    2. **From Scratch**: Manual selection -> Automated quantification -> Export.
- **Context Awareness (The Semaphore)**: A real-time visual indicator (Red/Yellow/Green) that warns if protein (Red), calories, or critical vitamins (Yellow) are missing based on the patient's specific profile or targets.
