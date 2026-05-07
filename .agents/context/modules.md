# NutriNet Application Modules

This document lists all active modules and routes in the NutriNet platform to ensure architectural awareness and prevent cross-module regressions.

## 1. Clinical Engine (Sequential Flow)
These modules are interdependent and share the same `Project` context.
- **Dieta** (`/dashboard/dieta`): The strategic food and restriction selection layer.
- **Recetas y Porciones** (`/dashboard/recetas`): Quantification, meal distribution, and AI-assisted portioning.
- **Carrito** (`/dashboard/carrito`): Automated shopping list generator based on the previous two stages.
- **Entregable** (`/dashboard/entregable`): Final document generation and export engine.

## 2. Core Clinical Modules
- **Pacientes** (`/dashboard/pacientes`): CRM for managing patient profiles, medical history, and clinical status.
- **Consultas** (`/dashboard/consultas`): Tracking and recording of individual clinical sessions.
- **Fitness & Antropometría** (`/dashboard/fitness`): Tracking of body measurements, body fat, and physical progress.
- **Citas** (`/dashboard/citas`): Professional calendar and appointment scheduling system.

## 3. Knowledge & Content Management
- **Alimentos** (`/dashboard/alimentos`): Global and personal catalog of ingredients and their nutritional values.
- **Platos** (`/dashboard/platos`): Library of reusable culinary creations.
- **Recursos** (`/dashboard/recursos`): Educational library (PDFs, templates, notes) for patients.
- **Creaciones** (`/dashboard/creaciones`): Management of all clinical artifacts saved by the nutritionist.
- **Sustitutos** (`/dashboard/sustitutos`): Database of food equivalencies and alternatives.

## 4. Quick Tools (Standalone)
- **Entregable Rápido** (`/dashboard/rapido`): Fast-track plan generation without full project orchestration.
- **Recetas Rápido** (`/dashboard/rapido/recetas`): AI-powered dish generation from natural language instructions.
- **Herramientas** (`/dashboard/herramientas`): Clinical calculators and utility formulas (BMI, Basal metabolic rate, etc.).

## 5. Administrative & Account Modules
- **Dashboard Admin** (`/dashboard/admin`): System-wide management for accounts, requests, and metrics.
- **Ajustes / Configuraciones** (`/dashboard/ajustes` & `/dashboard/configuraciones`): User profile, billing, and clinical defaults.
- **Actualizaciones** (`/dashboard/actualizaciones`): Platform changelog and new feature announcements.
- **Feedback & Soporte** (`/dashboard/feedback`): Channel for bug reports and feature requests.

## 6. Patient-Facing
- **Portal del Paciente** (`/portal`): External-facing interface where patients view their plans and record progress.

---
*Last updated: 2024-05-07*
