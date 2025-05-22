-- Final Database Schema Cleanup and Normalization
-- This migration ensures we have a clean, normalized schema

-- Drop legacy table-per-business tables if they exist
DROP TABLE IF EXISTS "L'Envol Art Space";
DROP TABLE IF EXISTS "The Little Prince Cafe";
DROP TABLE IF EXISTS "Vol de Nuit, The Hidden Bar";

-- Ensure businesses table exists with proper structure
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  business_type TEXT NOT NULL CHECK (business_type IN ('CAFE', 'BAR', 'GALLERY', 'OTHER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure reviews table exists with proper structure
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  name TEXT,
  text TEXT,
  texttranslated TEXT,
  publishedatdate TIMESTAMP WITH TIME ZONE,
  reviewurl TEXT,
  responsefromownertext TEXT,
  sentiment TEXT,
  staffmentioned TEXT,
  mainthemes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_publishedatdate ON reviews(publishedatdate DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_stars ON reviews(stars);

-- Insert default businesses if they don't exist
INSERT INTO businesses (name, business_type) VALUES 
  ('L''Envol Art Space', 'GALLERY'),
  ('The Little Prince Cafe', 'CAFE'),
  ('Vol de Nuit, The Hidden Bar', 'BAR')
ON CONFLICT (name) DO NOTHING;

-- Create saved_recommendations table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_recommendations_business_id ON saved_recommendations(business_id);
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_created_at ON saved_recommendations(created_at DESC);

-- Add RLS policies if not exists
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'Enable read access for authenticated users') THEN
    CREATE POLICY "Enable read access for authenticated users" ON businesses FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable read access for authenticated users') THEN
    CREATE POLICY "Enable read access for authenticated users" ON reviews FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_recommendations' AND policyname = 'Enable all access for authenticated users') THEN
    CREATE POLICY "Enable all access for authenticated users" ON saved_recommendations FOR ALL TO authenticated USING (true);
  END IF;
END $$;