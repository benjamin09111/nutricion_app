---
name: test-jest
description: Guía de comandos y estándares para escribir y ejecutar pruebas unitarias e integración usando Jest.
---
# Testing with Jest Playbook

Use this playbook when writing new tests or running existing tests.

## Running Tests
- **Backend Tests**:
  - Run all: `npm run test` or `pnpm test` under `backend/`.
  - Specific file: `npm run test -- <path_to_file>`.
  - Watch mode: `npm run test:watch`.
- **Frontend Tests**:
  - Run: `npm run test` under `frontend/`.

## Writing Unit Tests
- **Naming**: Test files must end with `.spec.ts` (backend) or `.test.tsx` / `.test.ts` (frontend).
- **Structure**: Use `describe`, `it`/`test`, and standard Jest assertions (`expect`).
- **Mocking**:
  - Mock third-party APIs (like OpenAI) using standard Jest mocks (`jest.mock(...)`).
  - Mock Prisma Service using a mock prisma client helper to keep DB access isolated from unit tests.
