-- Example Usage: Import Reviews with Language Data
-- This script demonstrates how to import reviews from previous databases that include language information

-- STEP 1: First, run the language column migration (if not already done)
-- This should already be applied: 20250524070000_add_language_column.sql

-- STEP 2: Run the import functions migration
-- This should be applied: 20250524080000_import_reviews_with_language.sql

-- STEP 3: Example of importing reviews for each business
-- Replace the JSON data below with your actual exported data from previous databases

-- Example 1: Import reviews for L'Envol Art Space
/*
SELECT import_reviews_with_language(
    'L''Envol Art Space',
    '[
        {
            "stars": 5,
            "name": "John Doe",
            "text": "Amazing art gallery with incredible exhibitions!",
            "texttranslated": "Galerie d''art incroyable avec des expositions fantastiques!",
            "publishedatdate": "2024-01-15T10:30:00Z",
            "reviewurl": "https://maps.google.com/review123",
            "responsefromownertext": "Thank you for your kind words!",
            "sentiment": "positive",
            "staffmentioned": "curator Sarah",
            "mainthemes": "art quality, exhibition",
            "language": "english"
        },
        {
            "stars": 4,
            "name": "Marie Dubois",
            "text": "Belle galerie, très bien située",
            "texttranslated": "Beautiful gallery, very well located",
            "publishedatdate": "2024-01-20T15:45:00Z",
            "reviewurl": "https://maps.google.com/review124",
            "responsefromownertext": "Merci beaucoup!",
            "sentiment": "positive",
            "staffmentioned": "",
            "mainthemes": "location, ambiance",
            "language": "french"
        }
    ]'::jsonb
);
*/

-- Example 2: Import reviews for The Little Prince Cafe
/*
SELECT import_reviews_with_language(
    'The Little Prince Cafe',
    '[
        {
            "stars": 5,
            "name": "Alice Smith",
            "text": "Perfect coffee and amazing atmosphere inspired by the Little Prince!",
            "texttranslated": "",
            "publishedatdate": "2024-02-01T09:15:00Z",
            "reviewurl": "https://maps.google.com/review125",
            "responsefromownertext": "So happy you enjoyed your visit!",
            "sentiment": "positive",
            "staffmentioned": "barista Tom",
            "mainthemes": "coffee quality, atmosphere, theme",
            "language": "english"
        }
    ]'::jsonb
);
*/

-- Example 3: Import reviews for Vol de Nuit, The Hidden Bar
/*
SELECT import_reviews_with_language(
    'Vol de Nuit, The Hidden Bar',
    '[
        {
            "stars": 4,
            "name": "Carlos Rodriguez",
            "text": "Bar escondido fantástico con cócteles únicos",
            "texttranslated": "Fantastic hidden bar with unique cocktails",
            "publishedatdate": "2024-02-10T20:30:00Z",
            "reviewurl": "https://maps.google.com/review126",
            "responsefromownertext": "¡Gracias por visitarnos!",
            "sentiment": "positive",
            "staffmentioned": "bartender Luis",
            "mainthemes": "cocktails, atmosphere, hidden location",
            "language": "spanish"
        }
    ]'::jsonb
);
*/

-- STEP 4: Validate the imported data
-- Check the language distribution across businesses
SELECT * FROM analyze_language_distribution();

-- Check import validation summary
SELECT * FROM validate_import_data();

-- STEP 5: Example of updating existing reviews with language data (if needed)
-- If you have existing reviews and want to add language information to them
/*
SELECT update_reviews_language_from_json(
    '[
        {"review_id": "uuid-of-existing-review-1", "language": "english"},
        {"review_id": "uuid-of-existing-review-2", "language": "french"},
        {"review_id": "uuid-of-existing-review-3", "language": "spanish"}
    ]'::jsonb
);
*/

-- STEP 6: Clean up temporary functions (optional)
-- You can remove these functions after import is complete
/*
DROP FUNCTION IF EXISTS get_business_id_by_name(TEXT);
DROP FUNCTION IF EXISTS import_reviews_with_language(TEXT, JSONB);
DROP FUNCTION IF EXISTS update_reviews_language_from_json(JSONB);
DROP FUNCTION IF EXISTS analyze_language_distribution();
DROP FUNCTION IF EXISTS validate_import_data();
*/

-- STEP 7: Verify final results
-- Check that all reviews now have language information
SELECT 
    b.name as business_name,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE r.language IS NOT NULL AND r.language != 'unknown') as reviews_with_language,
    COUNT(*) FILTER (WHERE r.language IS NULL OR r.language = 'unknown') as reviews_missing_language
FROM businesses b
JOIN reviews r ON b.id = r.business_id
GROUP BY b.name;

-- Show language distribution
SELECT 
    r.language,
    COUNT(*) as review_count,
    ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM reviews) * 100), 2) as percentage
FROM reviews r
GROUP BY r.language
ORDER BY review_count DESC;