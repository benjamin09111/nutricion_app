# Plan: Resolve AI Quota/API Error

## Goal
Fix the "quota finished" error reported by the user when using DeepSeek, despite having balance.

## Diagnosis
- **Hypothesis 1**: Non-standard parameters (`thinking`, `reasoning_effort`) at the root of the DeepSeek payload were causing a 400 Bad Request, triggering a fallback to `Abacus` which is actually out of quota.
- **Hypothesis 2**: The model `deepseek-v4-flash` might have specific tier requirements or different billing that returns a quota error.
- **Hypothesis 3**: Fallback providers (`Abacus`, `OpenAI`) are exhausted, and the user is seeing the error from the fallback instead of the primary provider.

## Steps
1. **Fix Code**: Remove `thinking` and `reasoning_effort` from `ai.service.ts` to use standard OpenAI-compatible format. (DONE)
2. **Improve Logging**: Add more detailed logging to `ai.service.ts` to identify which provider is failing and why.
3. **Verify Environment**: Suggest testing with `deepseek-chat` if `deepseek-v4-flash` persists in failing.
4. **Test**: Ask user to try generating recipes again.

## Verification
- AI generation in `/dashboard/rapido` should work using DeepSeek balance.
- Logs should show `[AI:deepseek] Request ok`.
