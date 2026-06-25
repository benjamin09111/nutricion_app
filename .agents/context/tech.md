# NutriNet Technical Specifications

This document outlines the specific libraries, versions, and technical conventions used in the NutriNet stack.

## 1. Frontend Environment (Next.js 16)
- **Framework**: Next.js 16.1.3 (App Router).
- **Core**: React 19.2.3, TypeScript 5.
- **State & Data Fetching**:
    - **API Queries**: `@tanstack/react-query` v5 for server state management.
    - **Form Management**: `react-hook-form` with `zod` for validation and `@hookform/resolvers`.
- **UI & Styling**:
    - **CSS**: Tailwind CSS 4.
    - **Icons**: `lucide-react`.
    - **Toasts**: `sonner` (Toast notifications).
    - **Charts**: `recharts` (Clinical metrics and progress).
    - **Rich Text**: `Tiptap` (Clinical reports and educational resources).
    - **Primitives**: `@headlessui/react` for accessible UI components.
- **Export & Media**:
    - **PDF/Docs**: `jspdf`, `@react-pdf/renderer`, `docx`, `html2canvas`.
    - **Screenshots**: `modern-screenshot` for capturing UI elements.
- **Client Utilities**: `js-cookie` for session tokens, `date-fns` for date manipulation.

## 2. Backend Environment (NestJS 11)
- **Framework**: NestJS 11.0.1.
- **Language**: TypeScript 5.9.3.
- **ORM**: Prisma 5.22.0 (PostgreSQL).
- **Caching & Queue**:
    - **Cache**: `cache-manager` with `cache-manager-redis-yet` (Redis 5.11+).
    - **Jobs**: `@nestjs/schedule` for periodic tasks (Cron).
- **Security & Auth**:
    - **Auth**: `passport-jwt`, `@nestjs/jwt`, `bcrypt` for password hashing.
    - **Middleware**: `helmet` (Secure headers), `csurf` (CSRF protection), `express-rate-limit`.
- **Logic & Validation**:
    - **Validation**: `class-validator` and `class-transformer` for strict DTO handling.
    - **Templates**: `handlebars` for dynamic email generation.
    - **Mailing**: `@nestjs-modules/mailer` with `nodemailer`.
- **File Processing**: `pdf-parse` for ingredient analysis, `xlsx` for Chilean market data import.

## 3. Database Schema Highlights
- **Primary Database**: PostgreSQL.
- **Core Entities**:
    - `Account`: Base authentication and plan level.
    - `Nutritionist`: Professional profile and relations to all clinical data.
    - `Patient`: Clinical records, antropometry, and restrictions.
    - `Project`: The orchestrator of the clinical flow (links Diet, Recipes, and Shopping Lists).
    - `Creation`: Generic container for AI-generated or manually crafted clinical artifacts (Diet, Recipes, Shopping List).
- **Relational vs. Flexible**:
    - **Relational Columns**: Used for identity, FKs, and critical status flags.
    - **JSONB Fields**: Heavily used for `Creation.content`, `Patient.dietRestrictions`, and `Consultation.metrics` to support dynamic clinical data.

## 4. Key Developer Commands
- **Frontend**: `npm run dev` (Starts Next.js on port 3000).
- **Backend**: `npm run start:dev` (Starts NestJS with watch mode).
- **Prisma**: `npx prisma studio` (DB Viewer), `npx prisma generate` (Types update).
- **DB Profiles**: `npm run db:use:local` / `npm run db:use:testing` (Switching environments).

---
*Last updated: 2024-05-07*
