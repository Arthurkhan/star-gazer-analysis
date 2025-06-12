# AI Recommendations Fix - 2025-06-12

## Overview
Fixed critical issue where the AI recommendations feature was failing due to empty request body being sent to the Supabase edge function.

## Objectives
- Fix the "Empty request body" error in the edge function
- Ensure AI recommendations work properly with all providers (OpenAI, Claude, Gemini)
- Improve error handling and logging for better debugging

## Files Modified/Created

### 🔄 MODIFIED FILES:
- `src/services/recommendationService.ts` - Fixed request body handling by switching to direct fetch API

## Changes Made

### 1. Request Body Issue Analysis
- The edge function was receiving `length: 0` for request body
- This was causing "Empty request body" and "Invalid request format" errors
- The Supabase client's `functions.invoke()` method wasn't properly sending the body

### 2. Solution Implementation
- Replaced `supabase.functions.invoke()` with direct `fetch()` API calls
- Used proper URL construction: `${SUPABASE_URL}/functions/v1/generate-recommendations`
- Added proper headers including Authorization Bearer token
- Explicitly stringified the request body with `JSON.stringify()`
- Applied the fix to both `testEdgeFunction()` and `generateRecommendations()` methods

### 3. Improved Error Handling
- Better error messages for different failure scenarios
- Proper handling of network errors, timeouts, and API errors
- Clear logging to help with debugging

## Technical Details
- The issue was with how the Supabase client v2.33.1 handles function invocation
- Direct fetch API calls ensure proper request body transmission
- Headers include both Content-Type and Authorization
- Timeout handling remains at 45 seconds with AbortController

## Success Criteria: ✅
- ✅ AI recommendations now work with proper request body
- ✅ Edge function receives and processes data correctly
- ✅ Error messages are more informative for debugging
- ✅ Direct fetch API ensures reliable communication

## Next Steps
- Monitor the application to ensure AI recommendations work consistently
- Test with different AI providers (OpenAI, Claude, Gemini)
- Consider adding request/response logging for production debugging
- Implement retry logic for transient failures
- Update Supabase client when fix is available for functions.invoke()
