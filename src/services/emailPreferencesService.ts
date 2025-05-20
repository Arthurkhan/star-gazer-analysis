import { supabase } from '@/integrations/supabase/client';
import { 
  EmailPreference, 
  EmailPreferenceWithBusinessInfo, 
  CreateEmailPreferenceParams, 
  UpdateEmailPreferenceParams,
  EmailType,
  EmailLog 
} from '@/types/emailPreferences';
import { Business } from '@/types/reviews';

/**
 * Get email preferences for a specific user and business
 */
export const getEmailPreference = async (
  userId: string, 
  businessId: string
): Promise<EmailPreference | null> => {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single();
    
    if (error) {
      console.error('Error fetching email preferences:', error);
      return null;
    }
    
    return data as EmailPreference;
  } catch (error) {
    console.error('Failed to fetch email preferences:', error);
    return null;
  }
};

/**
 * Get all email preferences for a user with business information
 */
export const getAllEmailPreferences = async (
  userId: string
): Promise<EmailPreferenceWithBusinessInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select(`
        *,
        business:businesses (
          id,
          name,
          business_type
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching all email preferences:', error);
      return [];
    }
    
    return data as EmailPreferenceWithBusinessInfo[];
  } catch (error) {
    console.error('Failed to fetch all email preferences:', error);
    return [];
  }
};

/**
 * Create a new email preference
 */
export const createEmailPreference = async (
  params: CreateEmailPreferenceParams
): Promise<EmailPreference | null> => {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .insert(params)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating email preference:', error);
      return null;
    }
    
    return data as EmailPreference;
  } catch (error) {
    console.error('Failed to create email preference:', error);
    return null;
  }
};

/**
 * Update an existing email preference
 */
export const updateEmailPreference = async (
  params: UpdateEmailPreferenceParams
): Promise<EmailPreference | null> => {
  try {
    const { id, ...updateData } = params;
    
    const { data, error } = await supabase
      .from('email_preferences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating email preference:', error);
      return null;
    }
    
    return data as EmailPreference;
  } catch (error) {
    console.error('Failed to update email preference:', error);
    return null;
  }
};

/**
 * Delete an email preference
 */
export const deleteEmailPreference = async (
  id: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('email_preferences')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting email preference:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete email preference:', error);
    return false;
  }
};

/**
 * Log an email that was sent
 */
export const logEmailSent = async (
  emailPreferenceId: string,
  emailType: EmailType,
  recipient: string,
  subject: string,
  status: 'success' | 'failed',
  errorMessage?: string
): Promise<EmailLog | null> => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        email_preference_id: emailPreferenceId,
        email_type: emailType,
        recipient,
        subject,
        status,
        error_message: errorMessage,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging email:', error);
      return null;
    }
    
    return data as EmailLog;
  } catch (error) {
    console.error('Failed to log email:', error);
    return null;
  }
};

/**
 * Get all users who have opted in for a specific email type
 */
export const getUsersForEmailType = async (
  emailType: EmailType,
  businessId?: string
): Promise<EmailPreferenceWithBusinessInfo[]> => {
  try {
    let query = supabase
      .from('email_preferences')
      .select(`
        *,
        business:businesses (
          id,
          name,
          business_type
        )
      `)
      .eq(emailType === EmailType.WEEKLY_SUMMARY ? 'weekly_summary' : 
          emailType === EmailType.URGENT_ALERT ? 'urgent_alerts' :
          emailType === EmailType.MONTHLY_PERFORMANCE ? 'monthly_performance' : 'trend_changes', true);
    
    // Filter by business if provided
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching users for ${emailType}:`, error);
      return [];
    }
    
    return data as EmailPreferenceWithBusinessInfo[];
  } catch (error) {
    console.error(`Failed to fetch users for ${emailType}:`, error);
    return [];
  }
};
