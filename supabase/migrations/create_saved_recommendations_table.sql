-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the saved_recommendations table
CREATE TABLE IF NOT EXISTS public.saved_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS saved_recommendations_user_id_idx ON public.saved_recommendations(user_id);

-- Set up row-level security
ALTER TABLE public.saved_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recommendations"
  ON public.saved_recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON public.saved_recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON public.saved_recommendations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
  ON public.saved_recommendations
  FOR DELETE
  USING (auth.uid() = user_id);