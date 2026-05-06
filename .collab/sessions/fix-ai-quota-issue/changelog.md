# Changelog: Resolve AI Quota/API Error

## Summary
Fixed an issue where AI generation would fail with a quota error despite having balance in DeepSeek.

## Changes
- **Backend**
  - `AiService`: Removed experimental `thinking` parameters that were causing DeepSeek calls to fail, triggering fallbacks to exhausted providers.
  - `AiService`: Added detailed error tracing for all providers in the fallback chain.

## Decision Rationale
- DeepSeek balance was not being used because the API payload contained non-standard fields.
- Fallback logic was masking the real error from DeepSeek and only showing the quota error from the last fallback provider.

## Next Steps
- Verify if `deepseek-v4-flash` works with the clean payload.
- If it still fails, suggest switching to `deepseek-chat` in `.env`.
