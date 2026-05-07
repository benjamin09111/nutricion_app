# Plan: Fix Production Mail Hang

The goal is to resolve the "hanging forever" issue in production when sending emails. This is caused by the backend awaiting email delivery from an SMTP server that might be timing out or blocked, without a defined timeout in the application.

## Problem Analysis
- Emails are sent using `@nestjs-modules/mailer` (Nodemailer).
- The `MailService` awaits every `sendMail` call.
- The `MailerModule` configuration lacks connection and socket timeouts.
- In production (Vercel/Cloud), network restrictions on port 465/587 can cause connections to hang if not handled correctly.

## Proposed Changes

### 1. Backend: Mail Module Configuration
- Update `backend/src/modules/mail/mail.module.ts` to include `connectionTimeout`, `greetingTimeout`, and `socketTimeout`.
- This ensures that if the SMTP server doesn't respond within a few seconds (e.g., 5s), the request fails or moves on instead of hanging forever.

### 2. Backend: Mail Service Refactor
- Modify `backend/src/modules/mail/mail.service.ts` to handle `sendMail` calls as safely as possible.
- Ensure that critical errors are logged but don't necessarily block the entire application flow if the email is secondary.

### 3. Backend: Decouple Business Logic from Email Waiting
- In `RequestsService` and `AuthService`, evaluate removing `await` from non-critical email notifications.
- This follows the "Thin Backend" principle where the user gets an immediate response while the email is processed "asynchronously" (even if not in a full queue yet, just by not awaiting the promise).

## Verification Plan
- Run `npm run lint` in the backend.
- Verify that emails still work locally.
- (Production verification will be done by the user).
