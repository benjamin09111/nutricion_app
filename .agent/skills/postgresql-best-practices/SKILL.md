---
name: postgresql-best-practices
description: Comprehensive guide for PostgreSQL best practices, optimization, database design, and scaling. Use this skill when the user asks for database design advice, SQL optimization, indexing strategies, or PostgreSQL performance tuning.
---

# PostgreSQL Best Practices & Optimization

This skill outlines the standards for designing robust, scalable, and high-performance PostgreSQL databases.

## 1. Database Design (Schema & Normalization)

### Naming Conventions (Readability)
- **Snake Case**: Use `snake_case` for all table names, column names, and indexes (e.g., `user_profiles`, `created_at`).
- **Plural Tables**: Use plural nouns for table names (e.g., `users`, `orders`).
- **Singular Columns**: Avoid table name prefix in columns unless necessary (e.g., `id` is better than `user_id` inside the `users` table).
- **Boolean IS/HAS**: Prefix booleans with `is_` or `has_` (e.g., `is_active`, `has_verified_email`).

### Keys & Constraints (Data Integrity)
- **Primary Keys**: Every table must have a Primary Key (UUIDs are preferred for distributed systems/security, Integers for strictly internal/perf critical tables).
- **Foreign Keys**: Always define FK constraints to ensure referential integrity.
- **Indexing FKs**: FK columns are NOT indexed by default. Index them explicitly if you frequently JOIN on them.

### JSONB vs Relational (Optimized Usage)
- **Prefer Relational**: Use columns for structured data that needs independent querying or constraints.
- **Use JSONB Sparingly**: Only use `JSONB` for truly varying unstructured data or where schema flexibility outweighs strict validation.
- **GIN Index**: If querying inside a JSONB column, create a GIN index on it.

## 2. Performance & Optimization

### Indexing Strategy
- **B-Tree**: Default for equality and range queries (`=`, `<`, `>`).
- **Unique Index**: Enforce uniqueness at the DB level, not just application level.
- **Partial Indexes**: Index only a subset of rows if you often query that subset.
  ```sql
  CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = true;
  ```
- **Composite Indexes**: Use for queries filtering by multiple columns (order matters: equality first, then range).

### Query Optimization
- **Avoid `SELECT *`**: Fetch only required columns to reduce I/O and network overhead.
- **Avoid `OR`**: `OR` conditions can sometimes kill index usage. Consider `UNION ALL`.
- **Explain Analyze**: Use `EXPLAIN ANALYZE` to inspect query plans for slow queries. Look for "Seq Scan" (Sequential Scan) on large tables—this usually implies a missing index.
- **Limit & Offset**: For large pagination, avoid deep `OFFSET`. Use specific "seek" (keyset) pagination (`WHERE id > last_seen_id LIMIT 10`).

## 3. Scalability

### Connection Pooling
- **Always Use a Pool**: PostgreSQL answers processes, not threads. Creating connections is expensive. Use a pooler (like PgBouncer) or the pool built-in to your ORM/Framework.

### Read Replicas
- Offload heavy `SELECT` reporting queries to a Read Replica to keep the Primary available for writes (`INSERT`, `UPDATE`, `DELETE`).

## 4. Maintenance & Manageability

### Migrations
- **Version Control**: All schema changes must be versioned migrations (e.g., TypeORM migrations, Prisma migrations, or raw SQL migrations).
- **Down Migrations**: Always write a rollback (`down`) script for every migration.

### Vacuuming
- Ensure `autovacuum` is on to prevent table bloat and wrap-around transaction ID issues.

## 5. Security

- **Least Privilege**: Application users should strictly have permissions only on tables they need.
- **No Superuser**: Never run the application as `postgres` superuser.
- **Encryption**: sensitive data (PII) should be encrypted at rest or application level if highly sensitive.
