-- Create the function to ensure the table exists
CREATE OR REPLACE FUNCTION public.create_recommendations_table()
RETURNS void AS $$
BEGIN
  -- This is already handled by the previous migration,
  -- but keeping the function for compatibility with your code
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_recommendations_table() TO anon, authenticated;