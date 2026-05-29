# Changelog: Transition to Resend API

## Summary
Replaced the problematic SMTP-based email system with a robust, API-driven solution using Resend. This eliminates all connectivity and timeout issues caused by cloud network restrictions.

## Changes
- **Dependency**: Added `resend` SDK.
- **MailService**: Refactored to use Resend API for delivery.
- **Template Engine**: Implemented manual Handlebars rendering for `.hbs` templates.
- **Infrastructure**: Simplified `MailModule`.

## Next Steps
- Add `RESEND_API_KEY` to production environment variables.
