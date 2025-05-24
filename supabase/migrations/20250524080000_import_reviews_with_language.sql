-- Data Import Migration: Import reviews from previous databases with language data
-- Migration: 2025-05-24 - Import reviews with language information from legacy databases
-- This script provides functions to import review data that already includes language information

BEGIN;

-- Create temporary function to map legacy business names to business IDs
CREATE OR REPLACE FUNCTION get_business_id_by_name(business_name TEXT)
RETURNS UUID AS $$
DECLARE
    business_uuid UUID;
BEGIN
    SELECT id INTO business_uuid 
    FROM businesses 
    WHERE name = business_name;
    
    IF business_uuid IS NULL THEN
        RAISE EXCEPTION 'Business not found: %', business_name;
    END IF;
    
    RETURN business_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to import reviews with language data
CREATE OR REPLACE FUNCTION import_reviews_with_language(
    p_business_name TEXT,
    p_reviews JSONB
) RETURNS INTEGER AS $$
DECLARE
    business_uuid UUID;
    review_data JSONB;
    imported_count INTEGER := 0;
    total_count INTEGER;
BEGIN
    -- Get business ID
    business_uuid := get_business_id_by_name(p_business_name);
    
    -- Get total count for progress tracking
    total_count := jsonb_array_length(p_reviews);
    RAISE NOTICE 'Starting import of % reviews for business: %', total_count, p_business_name;
    
    -- Process each review
    FOR review_data IN SELECT jsonb_array_elements(p_reviews)
    LOOP
        BEGIN
            -- Insert review with language data
            INSERT INTO reviews (
                business_id,
                stars,
                name,
                text,
                texttranslated,
                publishedatdate,
                reviewurl,
                responsefromownertext,
                sentiment,
                staffmentioned,
                mainthemes,
                language  -- This is the key addition - language field from previous database
            ) VALUES (
                business_uuid,
                COALESCE((review_data->>'stars')::INTEGER, 0),
                review_data->>'name',
                review_data->>'text',
                review_data->>'texttranslated',
                CASE 
                    WHEN review_data->>'publishedatdate' IS NOT NULL 
                    THEN (review_data->>'publishedatdate')::TIMESTAMP WITH TIME ZONE
                    ELSE NULL
                END,
                review_data->>'reviewurl',
                review_data->>'responsefromownertext',
                review_data->>'sentiment',
                review_data->>'staffmentioned',
                review_data->>'mainthemes',
                COALESCE(review_data->>'language', 'unknown')  -- Import language with fallback
            )
            ON CONFLICT (reviewurl) DO UPDATE SET
                -- Update existing reviews if they exist (based on review URL)
                language = COALESCE(EXCLUDED.language, reviews.language),
                sentiment = COALESCE(EXCLUDED.sentiment, reviews.sentiment),
                staffmentioned = COALESCE(EXCLUDED.staffmentioned, reviews.staffmentioned),
                mainthemes = COALESCE(EXCLUDED.mainthemes, reviews.mainthemes),
                updated_at = NOW();
            
            imported_count := imported_count + 1;
            
            -- Log progress every 100 reviews
            IF imported_count % 100 = 0 THEN
                RAISE NOTICE 'Imported % of % reviews (%.1f%%)', 
                    imported_count, total_count, 
                    (imported_count::DECIMAL / total_count * 100);
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue with other reviews
            RAISE WARNING 'Failed to import review: %. Error: %', review_data, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Import completed. Successfully imported % reviews for %', imported_count, p_business_name;
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update existing reviews with language data
CREATE OR REPLACE FUNCTION update_reviews_language_from_json(
    p_language_mappings JSONB
) RETURNS INTEGER AS $$
DECLARE
    mapping JSONB;
    updated_count INTEGER := 0;
    review_id_val UUID;
    language_val TEXT;
BEGIN
    RAISE NOTICE 'Starting language update for existing reviews';
    
    -- Process each language mapping
    FOR mapping IN SELECT jsonb_array_elements(p_language_mappings)
    LOOP
        BEGIN
            review_id_val := (mapping->>'review_id')::UUID;
            language_val := mapping->>'language';
            
            -- Update the review with language information
            UPDATE reviews 
            SET 
                language = language_val,
                updated_at = NOW()
            WHERE id = review_id_val
            AND (language IS NULL OR language = 'unknown');
            
            IF FOUND THEN
                updated_count := updated_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to update review %. Error: %', mapping, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Language update completed. Updated % reviews', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to analyze current language distribution
CREATE OR REPLACE FUNCTION analyze_language_distribution()
RETURNS TABLE(
    business_name TEXT,
    language TEXT,
    review_count BIGINT,
    percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH business_totals AS (
        SELECT 
            b.name as business_name,
            COUNT(*) as total_reviews
        FROM businesses b
        JOIN reviews r ON b.id = r.business_id
        GROUP BY b.name
    )
    SELECT 
        b.name as business_name,
        COALESCE(r.language, 'unknown') as language,
        COUNT(*) as review_count,
        ROUND((COUNT(*)::DECIMAL / bt.total_reviews * 100), 2) as percentage
    FROM businesses b
    JOIN reviews r ON b.id = r.business_id
    JOIN business_totals bt ON b.name = bt.business_name
    GROUP BY b.name, COALESCE(r.language, 'unknown'), bt.total_reviews
    ORDER BY b.name, review_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to validate imported data
CREATE OR REPLACE FUNCTION validate_import_data()
RETURNS TABLE(
    business_name TEXT,
    total_reviews BIGINT,
    reviews_with_language BIGINT,
    reviews_without_language BIGINT,
    unique_languages TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.name as business_name,
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE r.language IS NOT NULL AND r.language != 'unknown') as reviews_with_language,
        COUNT(*) FILTER (WHERE r.language IS NULL OR r.language = 'unknown') as reviews_without_language,
        ARRAY_AGG(DISTINCT r.language) FILTER (WHERE r.language IS NOT NULL) as unique_languages
    FROM businesses b
    JOIN reviews r ON b.id = r.business_id
    GROUP BY b.name
    ORDER BY b.name;
END;
$$ LANGUAGE plpgsql;

-- Add index on reviewurl for efficient conflict resolution during imports
CREATE INDEX IF NOT EXISTS idx_reviews_reviewurl_unique ON reviews(reviewurl) 
WHERE reviewurl IS NOT NULL;

-- Log completion
RAISE NOTICE 'Import functions created successfully. Available functions:';
RAISE NOTICE '1. import_reviews_with_language(business_name, reviews_json)';
RAISE NOTICE '2. update_reviews_language_from_json(language_mappings_json)';
RAISE NOTICE '3. analyze_language_distribution()';
RAISE NOTICE '4. validate_import_data()';

COMMIT;