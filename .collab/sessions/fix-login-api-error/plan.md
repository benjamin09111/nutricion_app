# Plan: Fix Login API Error (Unexpected Token '<')

The frontend is receiving HTML instead of JSON during login, likely because the backend is unreachable or returning an error page that is being intercepted/proxied incorrectly.

## Goal
Restore login functionality by ensuring stable communication between frontend and backend.

## Scope
- Backend listener configuration.
- Frontend environment variables.
- Process management.

## Steps
1. **Cleanup**: Terminate all existing node processes to ensure a clean state.
2. **Backend Config**: Update `backend/src/main.ts` to listen on `0.0.0.0` to avoid IPv4/IPv6 ambiguity.
3. **Frontend Config**: Update `frontend/.env.local` to use `localhost` instead of `127.0.0.1` for consistency.
4. **Execution**: Start backend and frontend.
5. **Verification**: Confirm backend is reachable via both `localhost` and `127.0.0.1`.

## Risks
- Killing all node processes will stop the current dev servers, but that's intended.
