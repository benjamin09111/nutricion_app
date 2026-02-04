---
name: supabase-best-practices
description: Comprehensive guide for Supabase best practices, security (RLS), optimization, and architectural patterns. Use this skill when implementing Auth, Storage, Realtime, or Database interactions via Supabase.
---

# Supabase Best Practices & Professional Standards

This skill defines the standards for leveraging Supabase exclusively as a Backend-as-a-Service (BaaS) or properly integrated with a custom backend.

## 1. Security First: Row Level Security (RLS)

**CRITICAL**: If you use the Supabase Client (`@supabase/supabase-js`) on the Frontend, RLS is your ONLY line of defense.
- **Enable RLS**: ALWAYS enable RLS on every table created in `public` schema.
  ```sql
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ```
- **Policies**: Define strict policies using `auth.uid()`.
  - *Select*: Users can read their own data.
  - *Insert*: Users can insert with their own ID.
  - *Update*: Users can update their own data.
  
**Service Role Key**: NEVER use the `service_role` key in the frontend. It bypasses RLS. Only use it in secure server-side contexts (Next.js API Routes / Server Actions).

## 2. Connection Management (Supavisor)

Supabase provides a connection pooler (Supavisor).
- **Transaction Mode (Port 6543)**: MANDATORY for Serverless environments (Next.js API Routes, Vercel, Server Actions). It prevents running out of connections.
- **Session Mode (Port 5432)**: Use only for long-lived connections (e.g., a persistent Docker container or local development migrations).
- **Prisma Integration**: Append `?pgbouncer=true` to the connection string when using Transaction Mode.

## 3. Authentication & User Management

- **Auth Triggers**: Don't rely on the client to create the "User Profile". Use a PostgreSQL Trigger on `auth.users` to automatically insert into your `public.users` table.
  ```sql
  create function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.users (id, email)
    values (new.id, new.email);
    return new;
  end;
  $$ language plpgsql security definer;
  ```
- **SSR in Next.js**: Use the `@supabase/ssr` package for proper cookie handling in Server Components and Server Actions.

## 4. Storage (Buckets)

- **Private by Default**: Buckets should be private. Use Signed URLs for temporary access.
- **Folder Structure**: Organize files logically (`/avatars/{userId}/image.png`).
- **RLS for Storage**: Storage also has RLS. Restrict uploads so users can only write to their own folders.

## 5. Performance Optimization

- **RPC (Remote Procedure Calls)**: If a logic requires multiple database steps (e.g., "deduct stock and create order"), write a PL/pgSQL function and call it via `supabase.rpc()` to do it in ONE roundtrip.
- **Realtime Filtering**: When using Realtime subscriptions, always filter by `eq` (e.g., `channel.on(..., filter: 'user_id=eq.'+uid)`) to avoid receiving widespread events.
- **Select Specific Columns**: `supabase.from('table').select('id, name')` instead of `select('*')`.

## 6. Type Safety

- **Generate Types**: Do not blindly type `any`. Use the Supabase CLI to generate TypeScript definitions from your schema.
  ```bash
  npx supabase gen types typescript --project-id ... > types/supabase.ts
  ```
- **Database Types**: Inject these types into the `createClient<Database>` generic.

## 7. Workflow & Migrations

- **Local Development**: Use `supabase start` to run a local instance. Do not develop directly against the production database.
- **Migrations**: Commit functionality changes as SQL migrations (`supabase migration new`).
- **Seed Data**: Maintain a `seed.sql` for reproducible development environments.

## 8. Avoiding "Vendor Lock-in" (Architectural Advice)

- While Supabase offers many tools, core business logic is often safer in your Next.js Server Actions or NestJS Services than in constrained Postgres Functions.
- Use Supabase primarily for: **Data Persistence (Postgres)**, **Auth**, and **Realtime**. Avoid over-using Edge Functions if a unified backend structure exists.
