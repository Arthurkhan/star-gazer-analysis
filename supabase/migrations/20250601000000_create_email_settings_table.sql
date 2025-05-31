-- Create email_settings table for storing email notification preferences
CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  recipient TEXT,
  schedules JSONB NOT NULL DEFAULT '{
    "weekly": {"enabled": false, "dayOfWeek": 1},
    "monthly": {"enabled": false, "dayOfMonth": 1},
    "urgent": {"enabled": false, "minSeverity": 3}
  }'::jsonb,
  content JSONB NOT NULL DEFAULT '{
    "includeCharts": true,
    "includeRecommendations": true,
    "includeTables": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on business_name for faster lookups
CREATE INDEX idx_email_settings_business_name ON public.email_settings(business_name);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE
    ON public.email_settings FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();

-- Add RLS policies if auth is enabled
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON public.email_settings
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.email_settings TO anon;
GRANT ALL ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;

-- Insert default settings for existing businesses
INSERT INTO public.email_settings (business_name, enabled, recipient)
VALUES 
  ('The Little Prince Cafe', false, ''),
  ('Vol de Nuit The Hidden Bar', false, ''),
  ('L''Envol Art Space', false, '')
ON CONFLICT (business_name) DO NOTHING;
