# Walkthrough: Global IPv4 DNS Preference Fix

## Changes Implemented

### 1. Global DNS Order (`ipv4first`)
Modified `backend/src/main.ts`:
- Added `dns.setDefaultResultOrder('ipv4first')`.
- **Why**: Modern versions of Node.js (17+) prefer IPv6 by default if the OS reports it's available. In many cloud environments (like Render), the OS has an IPv6 stack, but the outgoing network gateway is IPv4-only. This mismatch causes Node.js to try connecting to Google's IPv6 SMTP address first, which fails with `ENETUNREACH`. By forcing `ipv4first`, we ensure all network requests (SMTP, DB, APIs) prefer the stable IPv4 path.

### 2. Expanded Network Error Detection
Modified `backend/src/modules/mail/mail.service.ts`:
- Improved the detection logic for network-related errors to include `ECONNREFUSED` and generic "connection" or "unreachable" strings in the error message.
- This ensures that if the primary connection fails for ANY network-related reason, the fallback to Port 587 is triggered immediately.

## Verification
- Perform a redeploy.
- Check logs: The `connect ENETUNREACH 2607:f8b0...` (IPv6) errors should disappear, replaced by successful connections to IPv4 addresses or a smooth fallback to port 587.
