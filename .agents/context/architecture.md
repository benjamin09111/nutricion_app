# NutriNet Technical Architecture

This document describes the high-level architecture and design patterns used in NutriNet.

## 1. High-Level Stack
- **Frontend**: Next.js (App Router) with TailwindCSS.
- **Backend**: NestJS (Modular Monolith) following domain-driven design principles.
- **Database**: PostgreSQL with Prisma ORM.
- **Cache & Jobs**: Redis (planned/implemented for background tasks and caching).
- **External Integrations**: AI (OpenAI/Google Vertex), PDF generation, Cloud Functions for heavy processing.

## 2. Design Patterns & Principles

### Frontend Architecture (Next.js)
- **App Router**: Uses Next.js 13+ App Router for routing and layouts.
- **Server/Client Separation**: 
    - `page.tsx` acts as a lightweight entry point (often a Server Component).
    - `[Feature]Client.tsx` handles the complex UI logic and state (Client Component).
- **Component Colocation**: Features are organized by domain under `src/app/dashboard/[feature]`.
- **Global State**: Managed via hooks and props; minimal global state overhead for a "shallow consumer" experience.

### Backend Architecture (NestJS)
- **Modular Monolith**: Each domain (Patients, Diet, Recipes) is its own NestJS module (`src/modules/<domain>`).
- **Layered Architecture**:
    - **Controllers**: Handle HTTP requests and route to services.
    - **Services**: Contain all business logic and data orchestration.
    - **DTOs**: Ensure strict input validation using `class-validator`.
- **Hybrid Data Strategy**:
    - **Relational**: Used for core identity (ID, relationships, critical status).
    - **JSONB**: Used for flexible content (Food lists, variable preferences, AI outputs, and drafts). This allows for rapid iteration without frequent schema migrations.

### Data Flow & Orchestration
- **The Project Entity**: A central `Project` entity links a Patient with their active creations (Diet, Recipes, Shopping List). It acts as the orchestrator for the 4-stage clinical flow.
- **Event-Driven**: Modules communicate via events to maintain decoupling (e.g., creating a diet emits an event that might trigger the shopping list generator).

## 3. Deployment & Infrastructure
- **Thin Backend**: The core API is kept lightweight. Heavy tasks (like PDF analysis or complex AI generation) are offloaded to Cloud Functions or background workers.
- **Background Jobs**: BullMQ + Redis are used for asynchronous processing (e.g., sending emails, generating reports).

## 4. Key Security Patterns
- **IDOR Prevention**: Every request validates that the authenticated user owns the resource being accessed.
- **Sanitized Inputs**: All user-provided data is validated through DTOs before reaching the service layer.
- **Secure Authentication**: JWT-based authentication with secure cookie handling.

---
*Last updated: 2024-05-07*
