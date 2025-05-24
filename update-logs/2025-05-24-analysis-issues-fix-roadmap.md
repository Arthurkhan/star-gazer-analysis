# Analysis Issues Fix Roadmap - 2025-05-24

## Overview
Fix critical analysis display issues: 0% engagement rate, missing language data, empty thematic analysis, and broken staff mentions functionality.

## Root Cause Analysis

### Issues Identified:
1. **0% Engagement/Response Rate**: Field name case mismatch (`responseFromOwnerText` vs `responsefromownertext`)
2. **Missing Language Data**: No `language` column in current reviews table
3. **Empty Thematic Analysis**: Field name mismatches and missing data processing
4. **Broken Staff Mentions**: Field name case mismatch (`staffMentioned` vs `staffmentioned`)

### Core Problem:
Field name inconsistencies between:
- TypeScript interfaces (camelCase)
- Database schema (lowercase)
- Data processing functions expecting different field names

## Roadmap Implementation

### Phase 1: Database Schema Updates
**Objective**: Add missing columns and ensure consistent field naming

#### 1.1 Add Language Column to Reviews Table
```sql
-- Add language detection column
ALTER TABLE reviews ADD COLUMN language TEXT DEFAULT 'unknown';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language);
```

#### 1.2 Update Field Names for Consistency
- Keep database fields lowercase (PostgreSQL standard)
- Update TypeScript interfaces to match
- Fix data mapping in services

### Phase 2: Data Type and Interface Updates
**Objective**: Align TypeScript interfaces with actual database schema

#### 2.1 Update Review Interface
**File**: `/src/types/reviews.ts`
```typescript
export interface Review {
  id: string;
  business_id: string;
  stars: number;
  name: string;
  text: string;
  texttranslated?: string;  // Match DB field name
  publishedatdate?: string; // Match DB field name  
  reviewurl: string;
  responsefromownertext?: string; // Match DB field name
  sentiment?: string; 
  staffmentioned?: string; // Match DB field name
  mainthemes?: string; // Match DB field name
  language?: string; // New field
  created_at: string;
  
  // Computed/compatibility fields
  publishedAtDate?: string; // For backward compatibility
  responseFromOwnerText?: string; // For backward compatibility
  staffMentioned?: string; // For backward compatibility
  mainThemes?: string; // For backward compatibility
}
```

### Phase 3: Data Processing Layer Fixes
**Objective**: Fix data mapping and processing functions

#### 3.1 Update useDashboardData Hook
**File**: `/src/hooks/useDashboardData.ts`
- Fix field mapping in fetchAllReviewsWithPagination
- Add proper data transformation for field name consistency

#### 3.2 Update Analysis Utils
**File**: `/src/utils/analysisUtils.ts`
- Fix `calculateResponseAnalytics` to use correct field names
- Update thematic analysis to handle actual field names

#### 3.3 Update Review Data Utils
**File**: `/src/utils/reviewDataUtils.ts`
- Fix enhanced analysis generation
- Update staff mention processing

### Phase 4: Data Migration and Population
**Objective**: Populate missing data and fix existing data

#### 4.1 Language Detection Migration
```sql
-- Update existing reviews with language detection
-- This would require a service to detect languages from existing text
UPDATE reviews 
SET language = 'french' 
WHERE texttranslated IS NOT NULL AND texttranslated != text;

UPDATE reviews 
SET language = 'english' 
WHERE language IS NULL OR language = 'unknown';
```

#### 4.2 Data Normalization
- Ensure all text fields are properly processed
- Verify thematic data is properly extracted
- Check staff mentions are correctly identified

### Phase 5: Testing and Validation
**Objective**: Ensure all fixes work correctly

#### 5.1 Component Testing
- Test engagement rate calculation
- Verify thematic analysis displays
- Check staff mentions functionality
- Validate language data display

#### 5.2 Data Integrity Checks
- Verify response rate calculations
- Check thematic data extraction
- Validate staff mention detection

## Implementation Steps

### Step 1: Database Schema Updates ⚡ PRIORITY HIGH
```sql
-- Migration file: add_missing_columns.sql
BEGIN;

-- Add language column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'unknown';

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_responsefromownertext ON reviews(responsefromownertext) 
WHERE responsefromownertext IS NOT NULL;

COMMIT;
```

### Step 2: Fix Field Name Mapping ⚡ PRIORITY HIGH
**Files to Update:**
- `src/hooks/useDashboardData.ts`
- `src/utils/reviewDataUtils.ts`
- `src/utils/analysisUtils.ts`
- `src/types/reviews.ts`

**Key Changes:**
1. Update field references to use lowercase database field names
2. Add field mapping/transformation where needed
3. Maintain backward compatibility where possible

### Step 3: Fix Response Rate Calculation ⚡ PRIORITY HIGH
**File**: `src/utils/analysisUtils.ts`
**Function**: `calculateResponseAnalytics`
```typescript
// Fix this line (around line 369):
const reviewsWithResponse = reviews.filter(r => 
  r.responsefromownertext?.trim() || r.responseFromOwnerText?.trim()
).length;
```

### Step 4: Fix Thematic Analysis ⚡ PRIORITY HIGH
**File**: `src/utils/analysisUtils.ts`
**Function**: `calculateThematicAnalysis`
```typescript
// Fix field references to use actual database field names
const mentioningReviews = reviews.filter(review => 
  (review.mainthemes?.toLowerCase().includes(term.text.toLowerCase())) ||
  (review.mainThemes?.toLowerCase().includes(term.text.toLowerCase()))
);
```

### Step 5: Fix Staff Mentions ⚡ PRIORITY MEDIUM
**File**: `src/utils/reviewDataUtils.ts`
**Function**: `generateEnhancedAnalysis`
```typescript
// Update staff mention processing
if (review.staffmentioned || review.staffMentioned) {
  const staffData = review.staffmentioned || review.staffMentioned;
  // Process staff mentions...
}
```

### Step 6: Add Language Detection Service ⚡ PRIORITY MEDIUM
**New File**: `src/services/languageDetectionService.ts`
```typescript
export const detectLanguage = (text: string): string => {
  // Simple language detection logic
  // Could be enhanced with proper language detection library
};

export const populateLanguageData = async () => {
  // Service to populate language data for existing reviews
};
```

### Step 7: Update Display Components ⚡ PRIORITY LOW
**Files to Update:**
- `src/components/analysis/ThematicAnalysisSection.tsx`
- `src/components/analysis/AnalysisSummary.tsx`
- `src/components/analysis/StaffInsightsSection.tsx`

## Success Criteria: ✅/❌

### Critical Fixes:
- ✅ Response rate shows correct percentage (not 0%)
- ✅ Thematic analysis displays data from mainThemes column
- ✅ Staff mentions are properly detected and displayed
- ✅ Database field names are consistently handled

### Enhanced Features:
- ✅ Language column is added to reviews table
- ✅ Language data is populated for existing reviews
- ✅ Language analysis is displayed in operational insights
- ✅ All analysis components show actual data

### Performance & Reliability:
- ✅ No console errors related to field name mismatches
- ✅ Analysis generation performs within acceptable time limits
- ✅ Data consistency between database and UI

## Next Steps
1. **Immediate**: Implement Steps 1-5 to fix critical display issues
2. **Short-term**: Add language detection and population (Steps 6-7)
3. **Medium-term**: Enhance thematic analysis with more sophisticated processing
4. **Long-term**: Add real-time language detection for new reviews

## Technical Notes
- All field name mappings should handle both camelCase and lowercase variants
- Database schema should remain lowercase (PostgreSQL best practice)
- TypeScript interfaces should include both variants for compatibility
- Consider adding data validation middleware to catch future inconsistencies

## Estimated Timeline
- **Phase 1-3**: 1-2 days (critical fixes)
- **Phase 4**: 1 day (data migration)
- **Phase 5**: 1 day (testing and validation)
- **Total**: 3-5 days for complete implementation