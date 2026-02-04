---
trigger: always_on
---

# Engineering Standards & Best Practices

These rules apply to ANY software project. They define professional engineering behavior, quality standards, and code hygiene.

## 1. Laws of the Software Engineer (Mandatory)

1. **Protect the User**: The safety, privacy, and data security of the user is the highest priority. Never compromise security for features.
2. **Least Privilege**: Grant the minimum access necessary for a function to operate.
3. **Defense in Depth**: Assume every layer (frontend) can be breached. Secure the backend, database, and infrastructure independently.
4. **Input is Evil**: Treat all external input as malicious until validated and sanitized.
5. **Fail Safe**: Systems should default to a secure, locked state when they fail.

## 2. Security & Quality Mandates

- **Cybersecurity First**: Every feature must be designed with the `cybersecurity-best-practices` skill in mind.
- **Quality Assurance**: No feature is complete without verification. Use `qa-testing-standards` concepts to ensure stability.
- **Robust Forms**: All user input must follow `form-best-practices` (Zod validation, type safety, accessible UX).

## 3. Reusability & Component Architecture

- **Reusable Components**: Always prioritize reuse of existing components over creating new ones.
- **Component Abstraction**: Components should be generic enough to handle multiple use cases. Avoid "God Components".
- **File Management**: Do not proliferate files unnecessarily. Consolidate common patterns.

## 4. SEO & Semantic Integrity

- **Semantic HTML**: Strictly avoid "div soup". Use specialized HTML5 tags (`<main>`, `<section>`, etc).
- **Heading Hierarchy**: Ensure a single `<h1>` per page and correct descending order.
- **Accessibility**: If it's accessible, it's SEO-friendly.

## 5. Database Architecture & Optimization

- **Reference Skills**: Use `database-architecture` and `postgresql-best-practices`.
- **Normalization**: Follow 3NF unless documented otherwise.
- **Indexing**: MANDATORY indexing of all Foreign Keys and query fields.
- **Naming**: `snake_case` for DB, `camelCase` for code.
- **Scalability**: No "N+1" queries. Design for high throughput.

## 6. Error Handling & Observability

- **Reference Skill**: Use `error-handling-best-practices`.
- **Fail Loudly**: Never swallow errors silently.
- **Contextual Feedback**: Brief for users, detailed for logs.
- **Graceful Degradation**: Application shouldn't crash fully if a partial service fails.

## 7. Documentation Maintenance

- **Living Documentation**: Update docs (`README.md`, `ARCHITECTURE.md`) whenever a task "Important" is completed.
- **Developer Onboarding**: Instructions must assume zero tribal knowledge.
## 8. Decoupling & Event-Driven Patterns

- **Asynchronous Workflows**: Prefer events over direct service calls for non-blocking tasks (e.g., generating a shopping list after a diet is saved).
- **Backend Delgado (Thin Backend)**: Keep the main API server lightweight. Outsource heavy processing to Cloud Functions or background workers (BullMQ).
- **Service Independence**: A module should "emit" an event without knowing who handles it. This prevents "Spaghetti Relationships" in the backend.
- **Traceability**: All event-driven actions must be loggable and traceable to the original request.
