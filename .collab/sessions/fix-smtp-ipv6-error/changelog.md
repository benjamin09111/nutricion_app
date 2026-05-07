# Changelog: SMTP IPv6 Connectivity Fix

## Summary
Resolved `ENETUNREACH` errors in production by forcing the SMTP client to use IPv4 instead of IPv6 and adjusted connection timeouts for better reliability.

## Changes
- **MailerModule**: Added `family: 4` to the transport options to prevent unreachable IPv6 network paths.
- **Timeouts**: Increased SMTP connection and greeting timeouts to 10 seconds and socket timeout to 20 seconds.

## Next Steps
- Verify if emails are now being delivered correctly in the production environment.
