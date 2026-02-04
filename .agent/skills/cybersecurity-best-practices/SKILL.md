---
name: cybersecurity-best-practices
description: Comprehensive guide for web application security, anti-cheating, data protection, and secure coding practices. Use this skill to audit code, implement security features, and ensure user data is protected against common vulnerabilities (OWASP Top 10).
---

# Cybersecurity Best Practices

This skill outlines the mandatory security standards to protect the application and its users.

## 1. Core Principles (Zero Trust)

- **Never Trust Client Input**: All data from the frontend (body, params, query, headers) must be validated and sanitized on the backend.
- **Least Privilege**: Services and database users should only have the permissions absolutely necessary for their function.
- **Defense in Depth**: Layered security (WAF -> Load Balancer -> App Security -> Database Security).

## 2. Authentication & Authorization

### JWT Handling
- **Storage**: NEVER store sensitive JWTs in `localStorage`. Use **HttpOnly, Secure, SameSite** cookies.
- **Expiration**: Short-lived Access Tokens (e.g., 15 min) + Refresh Tokens (7 days).
- **Rotation**: Refresh tokens must be rotated/revoked upon use or logout.

### Password Security
- **Hashing**: Use robust algorithms (Argon2id or bcrypt with work factor > 10).
- **Complexity**: Enforce strong passwords (min 12 chars, mixed case, numbers, symbols).
- **Rate Limiting**: Protect login endpoints against Brute Force attacks (e.g., `@nestjs/throttler`).

## 3. Data Protection

### In Transit
- **HTTPS Only**: Enforce TLS 1.2+ for all communications.
- **Secure Headers**: Use `Helmet` to set HSTS, CSP, X-Frame-Options, X-Content-Type-Options.

### At Rest
- **Encryption**: Encrypt Sensitive PII (Personally Identifiable Information) in the database.
- **Backups**: Encrypt database backups.

### Data Exposure
- **DTO filtering**: Use `class-transformer` with `@Exclude()` to prevent accidental leakage of password hashes or internal IDs in API responses.
- **Error Handling**: NEVER return stack traces or raw database errors to the client in production. Use generic messages ("Something went wrong").

## 4. Input Validation & Sanitization

- **SQL Injection**: Always use ORMs (Prisma/TypeORM) or Parameterized Queries. Never string-concatenate SQL.
- **XSS (Cross-Site Scripting)**:
  - React/Next.js escapes content by default.
  - **Danger**: Avoid `dangerouslySetInnerHTML`. If necessary, use `dompurify`.
- **CSRF**: Use Anti-CSRF tokens if using cookie-based auth without strict SameSite guidelines.

## 5. Anti-Cheating & Business Logic Security

- **Server-Side Authority**: all critical calculations (prices, scores, inventory) MUST happen on the server. The client is a display only.
- **Idempotency**: Prevent double-spending or duplicate actions by using idempotency keys on sensitive POST requests.
- **Audit Logs**: Log all critical write operations (who_did_what_when) to an immutable log.

## 6. Access Control

- **RBAC/ABAC**: Implement strict Role-Based Access Control.
- **IDOR Prevention**: Verify that the remote user actually OWNS the resource ID they are requesting (e.g., `/orders/:id` -> check `order.userId === currentUser.id`).
