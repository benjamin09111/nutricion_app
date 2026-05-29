# Walkthrough: SMTP Automatic Fallback (465 -> 587)

## Changes Implemented

### 1. Unified Fallback Logic (`sendMailWithFallback`)
Modified `backend/src/modules/mail/mail.service.ts`:
- **Primary Attempt**: Always tries the configured port (usually 465) first using the injected `MailerService`.
- **Intelligent Fallback**: If a network error occurs (`ENETUNREACH`, `ETIMEDOUT`), it automatically triggers a second attempt using **Port 587** with **STARTTLS**.
- **Manual Transporter**: The fallback uses a fresh `nodemailer` transporter instance to bypass any fixed configuration of the module, ensuring it can switch ports on the fly.
- **Resilience**: This "double-shot" approach covers scenarios where one port is blocked by the cloud provider while another remains open.

### 2. Standardized Tracing
All mail methods now use this unified helper, ensuring consistent logging and error handling across the entire application.

## Verification
- If you see `⚠️ [MailService] Intento primario falló... Iniciando Fallback (Puerto 587)...` followed by `✅ [MailService] Correo enviado vía FALLBACK...`, it means the fallback was successful and saved the delivery.
- No further code changes are needed if either port 465 or 587 is available in your production environment.
