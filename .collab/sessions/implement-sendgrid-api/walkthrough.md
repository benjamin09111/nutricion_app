# Walkthrough: Transitioning to SendGrid API

## Changes Implemented

### 1. SendGrid SDK Integration
Modified `backend/src/modules/mail/mail.service.ts`:
- **Replaced Resend with SendGrid**: Switched from `resend` to `@sendgrid/mail`.
- **API Key Configuration**: The service now initializes SendGrid using the `SENDGRID_API_KEY` environment variable.
- **RESTful Delivery**: Like the previous Resend attempt, this uses HTTPS (port 443) for delivery, bypassing SMTP blocks.

### 2. Manual Handlebars Rendering
- Maintained the manual Handlebars rendering logic to ensure existing templates work with the SendGrid API payload.

### 3. Error Handling
- Added specific error extraction for SendGrid's response format to provide clearer logs in case of delivery failure (e.g., "The from address does not match a verified Sender Identity").

## Prerequisites for Production
1.  **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com).
2.  **Sender Authentication**: Create a **"Sender Identity"** in the SendGrid dashboard using your Gmail (`contactonutrinet.cl@gmail.com`). You will receive a verification email from SendGrid; you must click the link to authorize it.
3.  **API Key**: Generate an API Key and add it as `SENDGRID_API_KEY` in your Render environment variables.

## Verification
- Look for logs: `📧 [MailService] Enviando correo vía SendGrid API a: ...`
- Success log: `✅ [MailService] Correo enviado con éxito (SendGrid Status: 202)`
