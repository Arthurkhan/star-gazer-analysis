-- Phase 1: Database Schema Updates
-- Add missing language column and optimize indexes for analysis features
-- Migration: 2025-05-24 - Add language column and performance indexes

BEGIN;

-- Add language column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'unknown';

-- Add comment to document the language column
COMMENT ON COLUMN reviews.language IS 'Detected or specified language of the review text (e.g., english, french, spanish)';

-- Create performance indexes for analysis queries
CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);

-- Create composite index for performance analytics (response rate calculations)
CREATE INDEX IF NOT EXISTS idx_reviews_response_analysis ON reviews(responsefromownertext, stars) 
WHERE responsefromownertext IS NOT NULL;

-- Create index for thematic analysis queries
CREATE INDEX IF NOT EXISTS idx_reviews_themes ON reviews(mainthemes) 
WHERE mainthemes IS NOT NULL AND mainthemes != '';

-- Create index for staff mention analysis
CREATE INDEX IF NOT EXISTS idx_reviews_staff ON reviews(staffmentioned) 
WHERE staffmentioned IS NOT NULL AND staffmentioned != '';

-- Create composite index for date-based analysis
CREATE INDEX IF NOT EXISTS idx_reviews_date_analysis ON reviews(publishedatdate DESC, stars);

-- Update table statistics for better query planning
ANALYZE reviews;

-- Verify the new column exists and show table structure
DO $$
BEGIN
    -- Check if language column was added successfully
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'language'
    ) THEN
        RAISE NOTICE 'Language column added successfully to reviews table';
    ELSE
        RAISE EXCEPTION 'Failed to add language column to reviews table';
    END IF;
END $$;

COMMIT;