---
name: database-architecture
description: Guide for creating scalable, normalized, and optimized Database Schemas (PostgreSQL + Prisma).
---

# Database Architecture Best Practices

This skill defines the standards for designing database schemas that are **Scalable**, **Maintainable**, and **Optimized** for performance (low latency queries).

## 1. Schema Design Principles

### Normalization (3NF)
- **Goal**: Reduce data redundancy and ensure data integrity.
- **Rule**: Every non-key attribute must provide a fact about the key, the whole key, and nothing but the key.
- **Exception**: Denormalization is allowed ONLY for performance in high-read tables (e.g., storing a calculated `total_amount` in an `Order` table to avoid expensive joins on every view), but this must be documented.

### Naming Conventions (PostgreSQL Standard)
- **Tables**: `snake_case` (e.g., `user_profiles`, `meal_plans`). Plural names.
- **Columns**: `snake_case` (e.g., `created_at`, `first_name`).
- **Foreign Keys**: `singular_table_name_id` (e.g., `user_id` inside `posts`).
- **Indexes**: `idx_table_column` (e.g., `idx_users_email`).

## 2. Prisma & TypeScript Integration

Since we use Prisma ORM, we must leverage its features for type safety and optimization.

### Enums
Use database-level Enums for fixed sets of values (e.g., `Role`, `AppointmentStatus`).
```prisma
enum Role {
  ADMIN
  NUTRITIONIST
  PATIENT
}
```

### Relations
- Always define both sides of the relation in the schema to enable fluent API querying.
- Use `ON DELETE CASCADE` or `RESTRICT` appropriately. Never leave data orphaned unless strictly required (Soft Delete).

### Soft Deletes
For critical business data (Users, Medical Records), implement "Soft Delete".
- Add column: `deletedAt DateTime?`
- Queries must filter `where: { deletedAt: null }`.

## 3. High-Performance Indexing Strategy

Indexing is key for query speed in Postgres.

### Mandatory Indexes
- **Foreign Keys**: ALWAYS index foreign key columns (e.g., `patient_id` in `Appointments`). Postgres does not do this automatically, and it kills JOIN performance.
- **Search Filters**: Index columns frequently used in `WHERE`, `ORDER BY`, or `GROUP BY` clauses.
- **Unique Constraints**: Email, UUIDs, external IDs.

### Composite Indexes
If a query filters by multiple columns often (e.g., "Find patients by nutritionist AND status"), creates a multi-column index:
`@@index([nutritionistId, status])`

## 4. Scalability & JSONB

PostgreSQL allows hybrid SQL/NoSQL.
- **Use `JSONB`**: For flexible, schema-less data (e.g., `clinical_settings` which vary per user preference). `JSONB` is binary-optimized and indexable, unlike `JSON`.
- **Do NOT abuse JSONB**: If you need to query the fields inside often, make them proper columns.

## 5. Security (RLS considerations)
Since we use different roles (Nutritionist, Patient), the schema must support tenant isolation.
- Always include `nutritionistId` (Tenant ID) in data that belongs to a specific professional's practice.

## 6. Audit Fields
All tables must have:
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

## 7. Migration Workflow
1. Edit `schema.prisma`.
2. Run `npx prisma db migrate dev --name <descriptive_name>`.
3. NEVER edit the SQL migration file manually unless strictly necessary for complex operations (triggers, views).
