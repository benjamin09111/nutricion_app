# Walkthrough: Transitioning to Resend API

## Changes Implemented

### 1. Resend SDK Integration
Modified `backend/src/modules/mail/mail.service.ts`:
- **Removed Nodemailer/SMTP**: Eliminated all SMTP-related logic, including the failed IPv4 forcing and fallback mechanisms.
- **Added Resend Client**: Initialized the `Resend` SDK using the `RESEND_API_KEY` environment variable.
- **RESTful Delivery**: Emails are now sent via HTTPS POST requests to the Resend API, which bypasses all SMTP port blocking (25, 465, 587) and IPv6 connectivity issues.

### 2. Manual Handlebars Rendering
To preserve the existing email designs without relying on the `MailerModule`:
- **Direct Handlebars Usage**: Implemented a `renderTemplate` helper that reads `.hbs` files from the filesystem and compiles them manually.
- **Dual-Path Resolution**: The renderer checks both `dist` and `src` directories to ensure templates are found in both development and production environments.

### 3. Module Simplification
Modified `backend/src/modules/mail/mail.module.ts`:
- Stripped away the heavy `MailerModule` configuration.
- The module now simply provides the `MailService` globally.

## Prerequisites for Production
1.  **Obtain API Key**: Sign up at [resend.com](https://resend.com) and get an API Key.
2.  **Configure Environment**: Add `RESEND_API_KEY` to your Render environment variables.
3.  **Verify Domain (Optional)**: For production use, you should verify your domain in Resend to avoid using the `onboarding@resend.dev` sender.

## Verification
- Look for logs: `📧 [MailService] Enviando correo vía Resend API a: ...`
- Success log: `✅ [MailService] Correo enviado con éxito (Resend ID: ...)`
