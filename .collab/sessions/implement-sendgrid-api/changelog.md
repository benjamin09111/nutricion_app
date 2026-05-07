# Changelog: Transition to SendGrid API

## Summary
Switched the email delivery system to SendGrid API to allow sending from a verified Gmail address while maintaining the stability and security of a REST-based API over HTTPS.

## Changes
- **Dependency**: Added `@sendgrid/mail`.
- **MailService**: Refactored to use SendGrid API for delivery.
- **Template Engine**: Maintained manual Handlebars rendering.
- **Configuration**: Switched from `RESEND_API_KEY` to `SENDGRID_API_KEY`.

## Next Steps
- Add `SENDGRID_API_KEY` to production environment variables.
- Verify the "Sender Identity" in the SendGrid dashboard.
