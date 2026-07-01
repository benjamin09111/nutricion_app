# Walkthrough: Extreme SMTP IPv4 Forcing

## Changes Implemented

### 1. Custom DNS Lookup Logic
Modified `backend/src/modules/mail/mail.module.ts` and `backend/src/modules/mail/mail.service.ts`:
- **Forced IPv4 Lookup**: Added a custom `lookup` function that calls `dns.lookup` with `{ family: 4 }`. This bypasses Node.js's internal preference for IPv6 and prevents the system from even seeing the IPv6 addresses for `smtp.gmail.com`.
- **Local Binding**: Added `localAddress: '0.0.0.0'`. This tells the socket to strictly bind to an IPv4 interface on the local machine, preventing any attempt to use the `:::0` IPv6 interface.
- **Increased Buffers**: Bumped timeouts to 15s/30s to account for potential slow handshakes in the fallback path.

## Root Cause Analysis
The logs showed that even with `family: 4` and global DNS settings, the system was still attempting to connect to `2607:f8b0...` via `Local (:::0)`. This indicates that the hosting provider (Render) or the Node.js runtime was overriding the standard settings. The custom `lookup` function is the "nuclear option" to force IPv4.

## Verification
- If you still see `ENETUNREACH` to an IPv6 address after this, it means the hosting environment is forcing all DNS resolution through an IPv6 proxy that we cannot bypass via standard Node.js APIs.
