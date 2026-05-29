# Changelog: Fix Frontend Dev Lock

## Summary
Cleared zombie processes and lock files that prevented the frontend dev server from starting.

## Changes
- Terminated PIDs 9748 (port 3000) and 28608 (port 3001).
- Removed `frontend/.next/dev/lock`.

## Decisions
- Used `-Force` to ensure processes were killed and the lock file was removed.

## Next
Investigate the "Unexpected token '<'" error during login, which suggests a backend communication issue.
