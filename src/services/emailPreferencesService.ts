import { supabase } from '@/integrations/supabase/client';

export interface EmailPreferences {
  id?: string;
  businessId: string;
  emailAddress: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  notificationTypes: {
    summaryReports: boolean;
    urgentAlerts: boolean;
    performanceUpdates: boolean;
    trendChanges: boolean;
  };
  alertThresholds: {
    lowRatingThreshold: number; // Below this rating triggers alert
    highVolumeThreshold: number; // Above this review count triggers alert
    sentimentDropThreshold: number; // % drop in sentiment triggers alert
  };
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplate {
  type: 'summary' | 'alert' | 'performance' | 'trend';
  subject: string;
  template: string;
  variables: string[];
}

export class EmailPreferencesService {
  private static readonly TABLE_NAME = 'email_preferences';

  /**
   * Get email preferences for a specific business
   */
  static async getPreferences(businessId: string): Promise<EmailPreferences | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('businessId', businessId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return default
          return this.getDefaultPreferences(businessId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      return this.getDefaultPreferences(businessId);
    }
  }

  /**
   * Save email preferences for a business
   */
  static async savePreferences(preferences: EmailPreferences): Promise<EmailPreferences> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert({
          ...preferences,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving email preferences:', error);
      throw error;
    }
  }

  /**
   * Delete email preferences for a business
   */
  static async deletePreferences(businessId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('businessId', businessId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting email preferences:', error);
      throw error;
    }
  }

  /**
   * Get all businesses with email preferences enabled
   */
  static async getEnabledPreferences(): Promise<EmailPreferences[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching enabled preferences:', error);
      return [];
    }
  }

  /**
   * Update specific notification type
   */
  static async updateNotificationType(
    businessId: string,
    notificationType: keyof EmailPreferences['notificationTypes'],
    enabled: boolean
  ): Promise<void> {
    try {
      const preferences = await this.getPreferences(businessId);
      if (!preferences) throw new Error('Preferences not found');

      preferences.notificationTypes[notificationType] = enabled;
      await this.savePreferences(preferences);
    } catch (error) {
      console.error('Error updating notification type:', error);
      throw error;
    }
  }

  /**
   * Update alert thresholds
   */
  static async updateAlertThresholds(
    businessId: string,
    thresholds: Partial<EmailPreferences['alertThresholds']>
  ): Promise<void> {
    try {
      const preferences = await this.getPreferences(businessId);
      if (!preferences) throw new Error('Preferences not found');

      preferences.alertThresholds = {
        ...preferences.alertThresholds,
        ...thresholds,
      };
      await this.savePreferences(preferences);
    } catch (error) {
      console.error('Error updating alert thresholds:', error);
      throw error;
    }
  }

  /**
   * Get default email preferences
   */
  private static getDefaultPreferences(businessId: string): EmailPreferences {
    return {
      businessId,
      emailAddress: '',
      frequency: 'weekly',
      notificationTypes: {
        summaryReports: true,
        urgentAlerts: true,
        performanceUpdates: true,
        trendChanges: false,
      },
      alertThresholds: {
        lowRatingThreshold: 2.5,
        highVolumeThreshold: 50,
        sentimentDropThreshold: 20,
      },
      enabled: false,
    };
  }

  /**
   * Get email templates
   */
  static getEmailTemplates(): EmailTemplate[] {
    return [
      {
        type: 'summary',
        subject: 'Weekly Review Summary - {{businessName}}',
        template: `
          <h2>Weekly Review Summary for {{businessName}}</h2>
          <p>Here's your weekly performance summary:</p>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
            <h3>Key Metrics</h3>
            <ul>
              <li>Total Reviews: {{totalReviews}}</li>
              <li>Average Rating: {{averageRating}}/5</li>
              <li>Sentiment Score: {{sentimentScore}}%</li>
              <li>Response Rate: {{responseRate}}%</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; margin: 15px 0;">
            <h3>Highlights</h3>
            <p>{{highlights}}</p>
          </div>
          
          <div style="background: #fff5e8; padding: 15px; margin: 15px 0;">
            <h3>Areas for Improvement</h3>
            <p>{{improvements}}</p>
          </div>
          
          <p>For more detailed analysis, visit your dashboard.</p>
        `,
        variables: ['businessName', 'totalReviews', 'averageRating', 'sentimentScore', 'responseRate', 'highlights', 'improvements'],
      },
      {
        type: 'alert',
        subject: 'Alert: {{alertType}} for {{businessName}}',
        template: `
          <h2 style="color: #d32f2f;">Alert: {{alertType}}</h2>
          <p>We've detected an issue that requires your attention:</p>
          
          <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 15px 0;">
            <h3>{{alertTitle}}</h3>
            <p>{{alertDescription}}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
            <h3>Current Metrics</h3>
            <ul>
              <li>{{metric1}}</li>
              <li>{{metric2}}</li>
              <li>{{metric3}}</li>
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; margin: 15px 0;">
            <h3>Recommended Actions</h3>
            <p>{{recommendations}}</p>
          </div>
          
          <p>Please review your dashboard for more details and take appropriate action.</p>
        `,
        variables: ['businessName', 'alertType', 'alertTitle', 'alertDescription', 'metric1', 'metric2', 'metric3', 'recommendations'],
      },
      {
        type: 'performance',
        subject: 'Performance Update - {{businessName}}',
        template: `
          <h2>Performance Update for {{businessName}}</h2>
          <p>Your business performance for {{period}}:</p>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
            <h3>Performance Metrics</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Metric</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Current</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Previous</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Change</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Average Rating</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{currentRating}}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{previousRating}}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{ratingChange}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Review Count</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{currentCount}}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{previousCount}}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{countChange}}</td>
              </tr>
            </table>
          </div>
          
          <p>{{performanceInsights}}</p>
        `,
        variables: ['businessName', 'period', 'currentRating', 'previousRating', 'ratingChange', 'currentCount', 'previousCount', 'countChange', 'performanceInsights'],
      },
      {
        type: 'trend',
        subject: 'Trend Alert - {{trendType}} for {{businessName}}',
        template: `
          <h2>Trend Alert: {{trendType}}</h2>
          <p>We've identified a significant trend change for {{businessName}}:</p>
          
          <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0;">
            <h3>{{trendTitle}}</h3>
            <p>{{trendDescription}}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
            <h3>Trend Details</h3>
            <ul>
              <li>Duration: {{trendDuration}}</li>
              <li>Magnitude: {{trendMagnitude}}</li>
              <li>Confidence: {{trendConfidence}}</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; margin: 15px 0;">
            <h3>Strategic Implications</h3>
            <p>{{strategicImplications}}</p>
          </div>
          
          <p>Monitor this trend closely and consider taking strategic action.</p>
        `,
        variables: ['businessName', 'trendType', 'trendTitle', 'trendDescription', 'trendDuration', 'trendMagnitude', 'trendConfidence', 'strategicImplications'],
      },
    ];
  }

  /**
   * Validate email preferences
   */
  static validatePreferences(preferences: EmailPreferences): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!preferences.businessId) {
      errors.push('Business ID is required');
    }

    if (!preferences.emailAddress) {
      errors.push('Email address is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(preferences.emailAddress)) {
      errors.push('Invalid email address format');
    }

    if (!['daily', 'weekly', 'monthly'].includes(preferences.frequency)) {
      errors.push('Invalid frequency');
    }

    if (preferences.alertThresholds.lowRatingThreshold < 1 || preferences.alertThresholds.lowRatingThreshold > 5) {
      errors.push('Low rating threshold must be between 1 and 5');
    }

    if (preferences.alertThresholds.highVolumeThreshold < 1) {
      errors.push('High volume threshold must be at least 1');
    }

    if (preferences.alertThresholds.sentimentDropThreshold < 1 || preferences.alertThresholds.sentimentDropThreshold > 100) {
      errors.push('Sentiment drop threshold must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default EmailPreferencesService;
