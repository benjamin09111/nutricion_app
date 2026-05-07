# Walkthrough: Fix Production Mail Hang

## Changes Implemented

### 1. SMTP Transporter Timeouts
In `backend/src/modules/mail/mail.module.ts`, I added explicit timeouts to the mailer configuration:
- `connectionTimeout: 5000` (5s)
- `greetingTimeout: 5000` (5s)
- `socketTimeout: 10000` (10s)
This prevents the application from waiting indefinitely if the SMTP server is unreachable or hangs.

### 2. Non-blocking Email Sending
I refactored the following services/controllers to send emails "asynchronously" (without awaiting the promise) and with proper error catching:
- `RequestsService`: Request creation and status updates (Approval/Rejection).
- `AuthService`: Welcome emails and password resets.
- `SupportService`: Support/Feedback notifications.
- `PatientPortalsService`: Portal invitations and notifications.
- `NutritionistsController`: Booking link sharing.

## Verification
- **Lint**: Ran `npm run lint`. The project has many pre-existing lint errors (800+), but no syntax errors were introduced by my changes.
- **Logic**: The changes ensure that the main business logic (creating a request, approving a user) completes and returns a response to the frontend immediately, while the email process runs in the background. If the email fails or hangs, it will only log an error to the console instead of blocking the user.

## Why this solves the issue
In production environments (like Vercel or restricted VPS), SMTP connections can often hang due to firewall rules or port blocking (25, 465, 587). By adding timeouts and removing `await`, we ensure the application remains responsive regardless of the SMTP server's state.
