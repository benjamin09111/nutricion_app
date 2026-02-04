---
trigger: always_on
---

# Tech Stack Standards (Next.js & NestJS)

## 1. Frontend Standards (Next.js)

- **Language**: TypeScript is mandatory.
- **Styling**: TailwindCSS.
- **Interaction**: All clickable elements must have `cursor-pointer`.
- **UX**: Prioritize smooth scrolling and immediate feedback (hover/active states).
- **Metadata**: Use Next.js Metadata API, never manual headers.

## 2. Backend Standards (NestJS)

- **Language**: TypeScript is mandatory.
- **Architecture**: Modular Monolith. Divide code into clear domain modules (diet, patients, foods).
- **Data Modeling**:
  - **Structured (SQL)**: Rigid core data (ID, Relations, Email, Critical Status).
  - **Flexible (JSONB)**: Semi-structured data (Food lists, Variable preferences, Drafts, AI outputs).
  - **ORM**: Prisma (PostgreSQL).
- **Validation**: Use DTOs with `class-validator`.
- **Typing**: Strong typing across the stack.

## 3. General Architecture

- **Thin Backend (Backend Delgado)**: The core NestJS server acts as an orchestrator. Heavy processing or decoupled tasks are handled via triggers/events.
- **Event-Driven Decoupling**: Systems must communicate via events (e.g., "Dieta creada") to ensure modularity. Avoid tight coupling (e.g., the diet module shouldn't call the notification service directly).
- **Business Logic**: Never in controllers or UI components. Always in Services/Domain layer.
- **Failures**: No silent failures. Explicit error handling.

## 4. Cloud Functions & Workers

- **Compute**: Use Google Cloud Functions for agnostic, event-triggered logic (e.g., PDF analysis, AI generation).
- **Relational Access**: Functions connect to the same PostgreSQL DB, utilizing `JSONB` for storing flexible AI-generated data.
- **Job Queues**: Use BullMQ + Redis for asynchronous background processing within the NestJS ecosystem.

## 5. Automation & Integration (n8n)

- **Role**: Handle async workflows, third-party integrations (WhatsApp, Email), and scrapers.
- **Communication**: Webhooks to/from NestJS.
- **Rule**: Core business logic stays in NestJS. Volatile flows (notifications) go to n8n.
