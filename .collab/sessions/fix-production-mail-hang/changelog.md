# Changelog: Fix Production Mail Hang

## Summary
Fixed the "loading forever" issue in production when sending emails by adding transporter timeouts and making email sending non-blocking in core services.

## Changes
- **Mailer Module**: Added `connectionTimeout`, `greetingTimeout`, and `socketTimeout` to the SMTP transporter configuration.
- **Requests Module**: Removed `await` from email notifications in `RequestsService.create` and `RequestsService.updateStatus`.
- **Auth Module**: Removed `await` from welcome emails and password reset emails in `AuthService`.
- **Support Module**: Removed `await` from feedback and support notification emails.
- **Patient Portals**: Removed `await` from invitation and notification emails.
- **Nutritionists Controller**: Removed `await` from booking link sharing.

## Decisions
- Used the "Fire and Forget" pattern with `.catch` logging for emails. This follows the "Thin Backend" principle and prioritizes UX over guaranteed email delivery confirmation in the main request flow.
- Added 5-10s timeouts to Nodemailer to ensure that even background processes don't stay alive indefinitely in case of SMTP failure.

## Next Steps
- Implement a proper job queue (e.g., BullMQ) for email sending to ensure reliability and retries without blocking the main thread.
