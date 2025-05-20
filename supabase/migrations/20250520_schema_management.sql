-- Function to create businesses table if it doesn't exist
CREATE OR REPLACE FUNCTION create_businesses_table() 
RETURNS void AS $$
BEGIN
  -- Check if businesses table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses'
  ) THEN
    -- Create businesses table
    CREATE TABLE businesses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      business_type text NOT NULL,
      created_at timestamp with time zone DEFAULT now()
    );
    
    -- Add index on name for faster lookups
    CREATE INDEX businesses_name_idx ON businesses(name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create reviews table if it doesn't exist
CREATE OR REPLACE FUNCTION create_reviews_table() 
RETURNS void AS $$
BEGIN
  -- Check if reviews table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews'
  ) THEN
    -- Create reviews table
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
    
    -- Add indexes for common queries
    CREATE INDEX reviews_business_id_idx ON reviews(business_id);
    CREATE INDEX reviews_date_idx ON reviews(publishedatdate);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create recommendations table if it doesn't exist
CREATE OR REPLACE FUNCTION create_recommendations_table() 
RETURNS void AS $$
BEGIN
  -- Check if recommendations table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'recommendations'
  ) THEN
    -- Create recommendations table
    CREATE TABLE recommendations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id uuid REFERENCES businesses(id),
      recommendations jsonb,
      created_at timestamp with time zone DEFAULT now()
    );
    
    -- Add indexes
    CREATE INDEX recommendations_business_id_idx ON recommendations(business_id);
    CREATE INDEX recommendations_date_idx ON recommendations(created_at DESC);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to return db version info (used for connection testing)
CREATE OR REPLACE FUNCTION version() 
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'version', version(),
      'current_database', current_database(),
      'server_version', current_setting('server_version')
    )
  );
END;
$$ LANGUAGE plpgsql;