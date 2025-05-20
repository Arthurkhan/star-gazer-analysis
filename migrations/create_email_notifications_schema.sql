-- Create email_preferences table
CREATE TABLE email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  weekly_summary boolean DEFAULT false,
  urgent_alerts boolean DEFAULT false,
  monthly_performance boolean DEFAULT false,
  trend_changes boolean DEFAULT false,
  email varchar NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create email_logs table to track sent emails
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_preference_id uuid REFERENCES email_preferences(id),
  email_type varchar NOT NULL,
  recipient varchar NOT NULL,
  subject varchar NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status varchar NOT NULL,
  error_message varchar
);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_preferences
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON email_preferences
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();