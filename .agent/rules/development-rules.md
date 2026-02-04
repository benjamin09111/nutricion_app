---
trigger: always_on
description: General development rules for the project
---

# Development Rules

## Language & Internationalization
- **Always use English and Spanish**.
- **Use the project's dictionary files** (e.g., `src/lib/i18n/*.ts`) for all text. Avoid hardcoding strings whenever possible.
- If a translation key is missing, add it to the appropriate dictionary file or reuse an existing one.
- **English Comments**: All comments in the code must be written in English.

## React & Next.js Best Practices
- **Component Definition**: Never use `React.FC`. Define components as functions with explicitly defined and imported `Props` interfaces.
- **Modern Standards Only**: **Strictly avoid** deprecated features. Always implement the most current, recommended patterns and features for both **Next.js** and **Node.js**. This includes using modern hooks, server actions (where appropriate), and latest Node.js runtime features.
- **Reusability**: **Always** reuse existing components and services. Avoid creating new files or code redundancy if an existing solution fits.
- **Atomic Design**: Components should be atomic, separated, and independent. Follow React best practices for modularity.
- **Modern React Imports**: Avoid `import * as React` or `import React`. Use named imports (e.g., `import { useState, forwardRef } from 'react'`) and rely on the new JSX transform (no need to import React for JSX).

## Types & Interfaces (Organization & Standards)
- **Definición de Tipos**: 
  - **Enums**: Use them for constant values with business meaning (e.g., `UserRole`, `FoodCategory`).
  - **Interfaces**: Use them for object shapes, especially if extendable (e.g., `User`, `Food`).
  - **Union Types**: Preferred for simple UI options (e.g., `type ButtonVariant = 'primary' | 'secondary'`).
- **Organización por Dominio**: Prohibited global `/interfaces` or `/types` folders for feature-specific types. Types must live within the functional folder (e.g., `src/features/foods/foods.ts`).
- **Colocation**: If a type is used in ONLY one component, it can live in the same `.tsx` file or a sibling file named `component.types.ts`.
- **Global Types**: Use `src/types/` ONLY for entities that cross the ENTIRE application (e.g., session `User`, `Common` types). Structure it by domain-based files (e.g., `user.ts`).
- **Barrel Pattern (index.ts)**: Every type or component folder must have an `index.ts` acting as a "receptionist" (exporting everything from sibling files) for cleaner imports.
- **Explicit Props**: Components must always import their types/interfaces.

## Forms & Validation
- **Pre-submission Validation**: Always validate form inputs before sending data to the backend. Ensure required fields are filled, even if not explicitly stated, inferring necessity from backend logic (e.g., no empty strings allowed).

## Error Handling & Feedback
- **User & Developer Feedback**: Always handle errors gracefully. Display error messages to the user (via UI/Toast) AND log them for the developer. The application should never hang or leave the user guessing.
- **Loading States**: Always display the project's standard loading indicator during async operations, data fetching, or processing.

## Performance & Optimization
- **Big O Optimization**: Always optimize algorithms and functions for the best time complexity (Big O).
- **Query Optimization**: Optimize database queries and backend logic. Never accept slow performance; aim for the most efficient execution path.
- **Clean Code**: Keep code clean and concise (minimal lines of code without sacrificing readability). Avoid spaghetti code.

## Backend & Services
- **Strategy Pattern**: When creating backend services, use the **Strategy Pattern** to separate logic and ensure scalability. Organize services into a professional, ordered folder structure.
- **Service Reuse**: Always reuse existing services before creating new ones.
- **Security**: Prioritize maximum security. Follow cybersecurity best practices to prevent common attacks, bugs, or vulnerabilities.

## File Management & Imports
- **Minimize Files**: Avoid creating new files unless absolutely necessary.
- **Import Management**: When creating or moving folders/files, **immediately** update imports to prevent build errors.

## Design & Experience
- **UX & Design**: Every button, link, or interactive element **MUST** have the `cursor-pointer` class. This is a non-negotiable standard for all interactive components.
- **Visual Consistency**: Strictly follow the existing visual style and design patterns of the application.
- **Modals & Overlays**: All modals, drawers, or overlays **MUST** close when clicking outside of their main content area (on the backdrop). This behavior is non-negotiable and must be implemented for every interactive overlay.

## SEO & Semantic HTML
- **Semantic Tags**: Always prioritize semantic HTML tags (e.g., `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<nav>`, `<aside>`) over generic `<div>` containers. This improves SEO ranking and Google's understanding of the content structure.
- **Accessibility**: Semantic HTML also improves accessibility (a11y), which is a key factor for SEO.

## Maintenance & Documentation
- **Update Workflows**: If any critical logic or process is modified or added, **always** remind the user to update or create the corresponding workflow file (in `.agent/workflows`) to keep documentation up to date.