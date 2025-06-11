# Add AI vs Fallback Recommendation Indicator - 2025-06-11

## Overview
Added visual indicators to distinguish between AI-generated recommendations from OpenAI and fallback recommendations. This helps users understand whether they're seeing personalized AI insights or general best practices.

## Objectives
- Add metadata tracking to recommendations
- Display clear visual indicators for recommendation source
- Improve logging to show which type of recommendations are being used
- Help users understand the value of AI-generated vs fallback recommendations

## Files Modified/Created

### 🔄 MODIFIED FILES:
- `supabase/functions/generate-recommendations/index.ts` - Added metadata to track source (openai/fallback)
- `src/types/recommendations.ts` - Added RecommendationMetadata interface
- `src/services/recommendationService.ts` - Enhanced to handle metadata and improve logging
- `src/components/recommendations/RecommendationsDashboard.tsx` - Added visual indicators for AI vs fallback

## Changes Made

### 1. Metadata Tracking
- Added metadata object to recommendations containing:
  - `source`: 'openai' or 'fallback'
  - `model`: The AI model used (for OpenAI)
  - `reason`: Why fallback was used (if applicable)
  - `timestamp`: When generated
  - `responseTime`: How long the AI took to respond

### 2. Visual Indicators
- Green banner with brain icon for AI-powered recommendations
- Amber banner with bot icon for fallback recommendations
- Clear messaging explaining the source of recommendations
- Shows AI model used and reason for fallback when applicable

### 3. Enhanced Logging
- Console logs now clearly indicate whether using AI or fallback
- Shows response time for AI recommendations
- Displays reason when falling back to general recommendations

## Technical Details
- Metadata is included in edge function responses
- Frontend preserves and displays metadata appropriately
- No breaking changes - backwards compatible
- Clear visual distinction helps users understand recommendation quality

## Success Criteria: ✅
- ✅ Metadata added to track recommendation source
- ✅ Visual indicators display correctly
- ✅ Clear distinction between AI and fallback
- ✅ Enhanced logging for debugging

## Next Steps
- Deploy the updated edge function to apply changes
- Monitor user feedback on the indicators
- Consider adding confidence scores for AI recommendations
- Add user preference to always use AI (with retry logic)
