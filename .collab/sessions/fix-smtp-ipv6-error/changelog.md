# Changelog: Extreme SMTP IPv4 Forcing

## Summary
Implemented a last-resort "nuclear" option to force IPv4 connectivity for SMTP by overriding the DNS lookup mechanism and local socket binding.

## Changes
- **MailerModule & MailService**: Injected a custom DNS lookup function to filter out IPv6 addresses before connection attempts.
- **Socket Config**: Forced local binding to `0.0.0.0` (IPv4) to prevent IPv6 interface usage.

## Next Steps
- Redeploy and monitor logs. This is the most aggressive software-level fix possible for IPv4/IPv6 mismatch.
