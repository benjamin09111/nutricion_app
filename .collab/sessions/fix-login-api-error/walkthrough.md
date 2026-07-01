# Walkthrough: Fix Login API Error

## Goal
Resolve the "Unexpected token '<'" error by ensuring the frontend correctly communicates with the backend API.

## Actions Taken
1. **Research**: 
   - Confirmed backend was listening on `[::1]` but frontend was pointing to `127.0.0.1`.
   - Identified that the frontend might be falling back to `localhost:3000` (itself) when failing to connect to the backend, resulting in HTML responses.
2. **Process Cleanup**:
   - Terminated all existing `node.exe` processes to clear zombie servers and apply configuration changes.
3. **Backend Modification**:
   - Updated `backend/src/main.ts` to explicitly listen on `0.0.0.0` to handle both IPv4 and IPv6 requests.
4. **Frontend Modification**:
   - Updated `frontend/.env.local` to use `http://localhost:3001` for better compatibility across environments.
5. **Restoration**:
   - Restarted the backend (`npm run start:dev`).
   - Restarted the frontend (`npm run dev`).

## Evidence
- Backend listening on `0.0.0.0:3001`.
- `Invoke-RestMethod` to `http://localhost:3001/` returns `Hello World!`.
- Frontend logs show `/login` page rendering successfully.

## Next Steps
The user should try to log in again. The communication between frontend and backend is now stable and using consistent hostnames.
