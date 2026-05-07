# Walkthrough: Resolving SMTP IPv6 Connectivity Issues

## Changes Implemented

### 1. Forced IPv4 for SMTP (`family: 4`)
Modified `backend/src/modules/mail/mail.module.ts` to include `family: 4` in the transporter configuration.
- **Why**: The production environment was attempting to connect to Google's SMTP server via IPv6, resulting in `ENETUNREACH` (Network Unreachable). Forcing IPv4 ensures the connection uses the standard IPv4 path which is more universally supported by cloud hosting egress rules.

### 2. Increased Connection Timeouts
Increased the SMTP timeouts to be more generous:
- `connectionTimeout`: 10s
- `greetingTimeout`: 10s
- `socketTimeout`: 20s
- **Why**: This provides more breathing room for the initial handshake in high-latency production environments while still preventing the infinite "hanging" issue.

## Verification
- Monitor the backend logs for `📧 [MailService] Preparando correo...` followed by `✅ [MailService] Correo enviado...`.
- If `ENETUNREACH` persists, it may indicate a total block of port 465 by the hosting provider, in which case switching to port 587 (STARTTLS) would be the next step.
