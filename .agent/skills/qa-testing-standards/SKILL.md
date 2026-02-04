---
name: qa-testing-standards
description: Guide for Quality Assurance, Testing strategies, and ensuring software reliability. Use this skill when writing tests, setting up CI/CD pipelines, or debugging applications to prevent regressions.
---

# QA & Testing Standards

This skill outlines the strategies to ensure software reliability, maintainability, and bug prevention.

## 1. Testing Pyramid

### Unit Tests (The Foundation)
- **Scope**: Individual functions, classes, or components in isolation.
- **Tool**: Jest / Vitest.
- **Rule**: Mock all external dependencies (Database, APIs).
- **Target**: 100% coverage of business logic / utility functions.

### Integration Tests
- **Scope**: Interaction between modules (e.g., Service + Database, or Controller + Service).
- **Tool**: Jest / Supertest.
- **Rule**: Use a test database container (Docker). Do not mock the database driver here.

### E2E (End-to-End) Tests
- **Scope**: Full user workflows in a browser environment.
- **Tool**: Playwright / Cypress.
- **Rule**: Test critical "Happy Paths" (Login -> Create Patient -> Create Plan).

## 2. Testing Principles

- **AAA Pattern**: Arrange (setup), Act (execute), Assert (verify).
- **Determinism**: Tests must return the same result every time. Remove flaky tests immediately.
- **Independence**: One test should not depend on the state left by another test. Clean DB between tests.

## 3. Frontend QA (Next.js/React)

- **Component Testing**: Use `React Testing Library`.
- **User-Centric**: Query elements by accessibility roles (`getByRole('button', { name: /save/i })`), not just IDs or Classes. This enforces accessibility implementation.
- **Visual Regression**: Use snapshots for UI components to catch unintended styling changes.

## 4. Backend QA (NestJS)

- **DTO Validation Testing**: Test that invalid payloads are rejected with 400 errors.
- **Guard Testing**: Test that unauthorized users get 401/403 errors.
- **Error Handling**: Verify that exceptions are caught and transformed into proper HTTP responses.

## 5. The "Laws of QA"

1. **Test for Failure**: Don't just test that it works; test that it fails gracefully when inputs are wrong.
2. **Bug Repros**: If a bug is found, write a test that reproduces it BEFORE fixing it. This prevents regression.
3. **No Deploy without Green Tests**: CI/CD pipeline must block deployment if tests fail.
