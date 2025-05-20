import { User } from '@supabase/supabase-js';
import { Business } from './reviews';

export enum EmailType {
  WEEKLY_SUMMARY = 'weekly_summary',
  URGENT_ALERT = 'urgent_alert',
  MONTHLY_PERFORMANCE = 'monthly_performance',
  TREND_CHANGE = 'trend_change',
}

export interface EmailPreference {
  id: string;
  user_id: string;
  business_id: string;
  weekly_summary: boolean;
  urgent_alerts: boolean;
  monthly_performance: boolean;
  trend_changes: boolean;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface EmailPreferenceWithBusinessInfo extends EmailPreference {
  business?: Business;
}

export interface CreateEmailPreferenceParams {
  user_id: string;
  business_id: string;
  email: string;
  weekly_summary?: boolean;
  urgent_alerts?: boolean;
  monthly_performance?: boolean;
  trend_changes?: boolean;
}

export interface UpdateEmailPreferenceParams {
  id: string;
  weekly_summary?: boolean;
  urgent_alerts?: boolean;
  monthly_performance?: boolean;
  trend_changes?: boolean;
  email?: string;
}

export interface EmailLog {
  id: string;
  email_preference_id: string;
  email_type: EmailType;
  recipient: string;
  subject: string;
  sent_at: string;
  status: 'success' | 'failed';
  error_message?: string;
}
