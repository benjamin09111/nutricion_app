# Changelog: API 404 Resilience & JSON Handling

## Summary
Improved the application's resilience to API configuration errors and network failures by adding safety checks for JSON parsing and better origin candidate handling.

## Changes
- **Landing Page**: Added safety check for non-JSON responses during registration.
- **Admin Petitions**: Added safety check for non-JSON responses during status updates.
- **API Base**: Enhanced `fetchApi` to handle 50x errors and log connection failures.

## Critical Note for User
The `404` error persists because **`NEXT_PUBLIC_API_URL`** is not configured in Vercel. You must point it to your production backend URL.
