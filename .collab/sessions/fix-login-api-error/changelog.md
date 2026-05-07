# Changelog: Fix Login API Error

## Summary
Investigated and resolved communication issues between frontend and backend. Performed a final global cleanup as requested by the user.

## Changes
- Updated `backend/src/main.ts` to listen on `0.0.0.0`.
- Updated `frontend/.env.local` to use `localhost:3001`.
- Terminated all Node.js/NPM/NPX processes.
- Removed `frontend/.next/dev/lock`.

## Decisions
- Switched to `0.0.0.0` to avoid potential IPv4/IPv6 loopback issues on Windows.
- Cleaned all processes to give the user full control of the ports.

## Next
User will run the servers manually.
