# Walkthrough: API 404 Resilience & JSON Handling

## Changes Implemented

### 1. Robust API Fetching (`fetchApi`)
Modified `frontend/src/lib/api-base.ts`:
- Added `502, 503, 504` to the list of statuses that trigger a failover to the next candidate origin.
- Improved logging to show which origin failed to connect.

### 2. JSON Parsing Safety
Modified `frontend/src/app/page.tsx` and `frontend/src/app/dashboard/admin/peticiones/page.tsx`:
- Added a check for `content-type: application/json` before calling `response.json()`.
- If the response is not JSON (e.g., a Vercel 404 HTML page), the code now throws a descriptive error like `Error 404: El servidor no respondió con un formato válido` instead of crashing with `is not a valid json`.

## Root Cause Analysis
The `404 (Not Found)` on `https://nutricion-app-seven.vercel.app/requests` indicates that the frontend is defaulting to its own domain because `NEXT_PUBLIC_API_URL` is likely not set in the Vercel project settings. Since Vercel only hosts the frontend, it returns a 404 for the `/requests` path.

## Verification
- Form submission on the landing page will now show a Toast with "Error 404..." instead of a console crash.
- Admin dashboard will handle API errors without crashing the UI.
