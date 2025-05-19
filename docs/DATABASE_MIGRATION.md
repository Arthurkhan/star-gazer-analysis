# Database Schema Migration Guide

This guide explains the database schema changes implemented to optimize the Star-Gazer-Analysis application for better performance and scalability.

## New Schema Structure

We've migrated from a "one table per business" approach to a normalized relational schema:

```sql
-- Businesses table: Stores information about each business
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Reviews table: Stores all reviews with foreign key to businesses
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id),
  stars integer,
  name text,
  text text,
  texttranslated text,
  publishedatdate timestamp with time zone,
  reviewurl text,
  responsefromownertext text,
  sentiment text,
  staffmentioned text,
  mainthemes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Recommendations table: Stores AI-generated recommendations for businesses
CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id),
  recommendations jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

## Benefits of the New Schema

1. **Scalability**: Adding a new business no longer requires creating a new table
2. **Query Efficiency**: Easier to query across businesses with joins
3. **Maintainability**: Code is simpler without needing to handle dynamic table names
4. **Performance**: Proper indexes can be applied consistently
5. **Features**: Easier to implement cross-business comparisons
6. **Future-proofing**: Simpler to extend with additional related entities

## Migration Steps

### A. Automatic Migration (Recommended)

1. An admin UI component has been added to automatically migrate your data
2. Visit the Settings page and look for the "Database Migration" card
3. Click "Migrate Database" button to start the migration
4. The app will handle creating businesses and moving all reviews

### B. Manual Migration

If you prefer to run the migration manually:

1. Create the tables using the SQL statements above
2. Import the dataMigration.ts utility from '@/utils/dataMigration'
3. Call the migrateDataToNewSchema() function:

```typescript
import { migrateDataToNewSchema } from '@/utils/dataMigration';

// In an async function:
const result = await migrateDataToNewSchema();
console.log('Migration result:', result);
```

## Adding Indexes (Optional but Recommended)

For optimal performance with larger datasets, consider adding these indexes:

```sql
-- Index for reviews by business_id
CREATE INDEX reviews_business_id_idx ON reviews(business_id);

-- Index for reviews by date
CREATE INDEX reviews_date_idx ON reviews(publishedatdate);

-- Index for recommendations by business_id
CREATE INDEX recommendations_business_id_idx ON recommendations(business_id);

-- Index for recommendations by date (newest first)
CREATE INDEX recommendations_date_idx ON recommendations(created_at DESC);
```

## Manual Table Creation (Advanced Users Only)

If you're setting up the database from scratch:

1. Execute the table creation SQL above in your Supabase SQL editor
2. Create the recommended indexes
3. Use the BusinessMappings.ts utility to maintain the mapping between business names and types

## Code Changes

The following files have been updated to work with the new schema:

1. `src/types/reviews.ts` - Updated types for the new schema
2. `src/types/BusinessMappings.ts` - Added to map between business names and types
3. `src/services/reviewDataService.ts` - Completely rewritten for the new schema
4. `src/hooks/useDashboardData.ts` - Updated to work with new services
5. `supabase/functions/generate-recommendations/index.ts` - Modified edge function
6. `src/services/recommendationService.ts` - Updated client-side implementation
7. `src/services/ai/browserAI.ts` - Enhanced with null checking and fixes
8. `src/utils/dataMigration.ts` - Added for data migration
9. `src/components/DatabaseMigration.tsx` - UI for migration

## Compatibility Notes

- The new implementation maintains backward compatibility with existing code
- Functions retain the same signatures but work with the new schema internally
- All previous functionality continues to work with the optimized data structure
