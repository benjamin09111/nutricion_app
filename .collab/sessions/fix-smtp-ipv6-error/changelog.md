# Changelog: Global IPv4 DNS Preference Fix

## Summary
Forced the entire backend application to prefer IPv4 for DNS resolution to eliminate persistent `ENETUNREACH` errors when connecting to Google's SMTP servers in production.

## Changes
- **Main Entry Point**: Set global DNS default result order to `ipv4first`.
- **Mail Service**: Expanded error matching to more reliably trigger the SMTP fallback mechanism.

## Next Steps
- Verify email delivery in production. This global setting is the most robust way to handle IPv6/IPv4 mismatch in cloud environments.
