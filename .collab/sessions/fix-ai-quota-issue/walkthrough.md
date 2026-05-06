# Walkthrough: Resolve AI Quota/API Error

## Changes Made
- **File**: `backend/src/common/services/ai.service.ts`
  - Removed `thinking` and `reasoning_effort` parameters for DeepSeek. These were non-standard root-level parameters that could cause 400 errors or unintended behaviors in some API tiers.
  - Improved logging to show all provider errors in the final exception. This allows us to see exactly why DeepSeek is failing and if it's falling back to an exhausted provider.

## Findings
- DeepSeek V4-Flash exists but standard Chat Completions often prefer cleaner payloads.
- The "quota finished" error is likely coming from a fallback (Abacus/OpenAI) because DeepSeek failed for some reason.
- By providing cleaner parameters, DeepSeek should now handle the request correctly using the user's balance.

## Verification
- Code has been updated.
- Next step: User to test AI generation.
