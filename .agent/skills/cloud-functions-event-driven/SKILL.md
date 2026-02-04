# Cloud Functions & Event-Driven Architecture

This skill defines the standards for implementing a **Thin Backend (Backend Delgado)** using Cloud Functions and Event-Driven patterns in the NutriSaaS project.

## 1. Core Principles
- **Orchestration vs Choreography**: The main NestJS backend orchestrates the high-level flow but delegates the heavy lifting (IA, PDF processing, complex calculations) to Cloud Functions.
- **Event-Driven**: Modules (Agents) communicate via events. A "Diet Created" event triggers the "Shopping List Generation" without the Diet module knowing about the Shopping List module.
- **Statelessness**: Cloud Functions must be stateless and idempotent.

## 2. Technical Implementation
- **Triggers**: Use Pub/Sub, Webhooks, or Direct DB Triggers to fire functions.
- **Relational Access**: Functions connect to the PostgreSQL DB using Prisma or a lightweight driver.
- **JSONB for Intelligence**: Use the `JSONB` column type to store AI-generated data, analysis results, and flexible schemas that don't need strict relational structure.
- **Markdown (MD) Engine**: AI Agents must output content in Markdown. This serves as the universal format for:
    - Previewing in the Web UI.
    - Editing by the Nutritionist.
    - Converting to HTML/PDF/Canvas for the patient.

## 3. Communication Patterns
- **NestJS -> Cloud Function**: Emit event via Redis (BullMQ) or HTTP Trigger.
- **Cloud Function -> NestJS**: Callback via Webhook or direct DB update (status flag).
- **Direct DB Update**: Preferred for background tasks where the UI "polls" or uses "WebSockets" for completion status.

## 4. Best Practices
- **Timeout Management**: Ensure functions have appropriate timeouts for heavy tasks (e.g., IA generation).
- **Error Propagation**: Log errors in the Cloud Function and update the DB status (e.g., `process_status: 'FAILED'`) so the main app can inform the user.
- **Backend Delgado**: If a logic block takes more than 2 seconds or 200MB of RAM, it belongs in a Cloud Function or Worker.
