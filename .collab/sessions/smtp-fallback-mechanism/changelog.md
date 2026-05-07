# Changelog: SMTP Automatic Fallback (465 -> 587)

## Summary
Implemented a self-healing email delivery system that automatically switches to an alternative SMTP port (587) if the primary port (465) is unreachable due to network restrictions.

## Changes
- **MailService**: Added `sendMailWithFallback` private method.
- **Failover**: Automatic retry logic for `ENETUNREACH` and `ETIMEDOUT` errors.
- **Architecture**: Decoupled fallback attempts from the main `MailerModule` configuration to allow dynamic port switching.

## Next Steps
- Perform a redeploy and monitor logs. The system is now significantly more robust against provider-side network blocks.
