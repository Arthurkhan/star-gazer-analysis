import { Review } from '@/types/reviews';
import { BusinessType } from '@/types/businessTypes';
import { EmailSettings, EmailOptions, sendUrgentAlert } from './emailService';
import { 
  ThresholdAlert, 
  PerformanceThresholds, 
  DEFAULT_THRESHOLDS,
  checkPerformanceThresholds,
  ComparisonMetrics,
  comparePeriods,
  generateComparisonPeriods,
  PeriodData
} from '@/utils/comparisonUtils';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationRule {
  id: string;
  businessName: string;
  type: 'threshold' | 'trend' | 'comparison';
  enabled: boolean;
  conditions: NotificationConditions;
  actions: NotificationAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationConditions {
  thresholds?: PerformanceThresholds;
  trendPeriod?: 'daily' | 'weekly' | 'monthly';
  comparisonPeriod?: 'week' | 'month' | 'quarter' | 'year';
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
}

export interface NotificationAction {
  type: 'email' | 'dashboard_alert' | 'webhook';
  config: {
    recipients?: string[];
    webhookUrl?: string;
    template?: string;
  };
}

export interface AnalysisAlert {
  id: string;
  businessName: string;
  type: 'performance' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  triggered: Date;
  acknowledged: boolean;
  emailSent: boolean;
}

export interface TrendAlert {
  id: string;
  type: 'rating_decline' | 'sentiment_shift' | 'volume_change' | 'response_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  threshold: number;
  businessName: string;
  period: string;
  timestamp: Date;
}

export class AnalysisNotificationService {
  private static instance: AnalysisNotificationService;
  private alertHistory: Map<string, AnalysisAlert[]> = new Map();
  private notificationRules: Map<string, NotificationRule[]> = new Map();

  public static getInstance(): AnalysisNotificationService {
    if (!AnalysisNotificationService.instance) {
      AnalysisNotificationService.instance = new AnalysisNotificationService();
    }
    return AnalysisNotificationService.instance;
  }

  /**
   * Analyze reviews and trigger appropriate notifications
   */
  async analyzeAndNotify(
    reviews: Review[],
    businessName: string,
    businessType: BusinessType,
    emailSettings?: EmailSettings
  ): Promise<AnalysisAlert[]> {
    const alerts: AnalysisAlert[] = [];

    try {
      // Get notification rules for this business
      const rules = await this.getNotificationRules(businessName);

      // Check performance thresholds
      const thresholdAlerts = await this.checkThresholdAlerts(reviews, businessName, rules);
      alerts.push(...thresholdAlerts);

      // Check trend alerts
      const trendAlerts = await this.checkTrendAlerts(reviews, businessName, rules);
      alerts.push(...trendAlerts);

      // Check comparison alerts
      const comparisonAlerts = await this.checkComparisonAlerts(reviews, businessName, rules);
      alerts.push(...comparisonAlerts);

      // Process notifications for triggered alerts
      await this.processNotifications(alerts, businessName, businessType, emailSettings);

      // Store alerts in history
      this.storeAlerts(businessName, alerts);

      return alerts;
    } catch (error) {
      console.error('Error in analyzeAndNotify:', error);
      throw error;
    }
  }

  /**
   * Check threshold-based alerts
   */
  private async checkThresholdAlerts(
    reviews: Review[],
    businessName: string,
    rules: NotificationRule[]
  ): Promise<AnalysisAlert[]> {
    const alerts: AnalysisAlert[] = [];
    
    const thresholdRules = rules.filter(rule => rule.type === 'threshold' && rule.enabled);
    
    for (const rule of thresholdRules) {
      const thresholds = rule.conditions.thresholds || DEFAULT_THRESHOLDS;
      const thresholdAlerts = checkPerformanceThresholds(reviews, businessName, thresholds);
      
      // Filter by severity if specified
      const filteredAlerts = rule.conditions.severity 
        ? thresholdAlerts.filter(alert => rule.conditions.severity!.includes(alert.severity))
        : thresholdAlerts;

      // Convert threshold alerts to analysis alerts
      for (const thresholdAlert of filteredAlerts) {
        alerts.push({
          id: `analysis-${thresholdAlert.id}`,
          businessName,
          type: 'performance',
          severity: thresholdAlert.severity,
          title: thresholdAlert.title,
          message: thresholdAlert.message,
          data: {
            threshold: thresholdAlert,
            ruleId: rule.id,
          },
          triggered: new Date(),
          acknowledged: false,
          emailSent: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Check trend-based alerts
   */
  private async checkTrendAlerts(
    reviews: Review[],
    businessName: string,
    rules: NotificationRule[]
  ): Promise<AnalysisAlert[]> {
    const alerts: AnalysisAlert[] = [];
    
    const trendRules = rules.filter(rule => rule.type === 'trend' && rule.enabled);
    
    for (const rule of trendRules) {
      const period = rule.conditions.trendPeriod || 'weekly';
      const trendAlerts = await this.analyzeTrends(reviews, businessName, period);
      
      // Filter by severity if specified
      const filteredAlerts = rule.conditions.severity 
        ? trendAlerts.filter(alert => rule.conditions.severity!.includes(alert.severity))
        : trendAlerts;

      // Convert trend alerts to analysis alerts
      for (const trendAlert of filteredAlerts) {
        alerts.push({
          id: `trend-${trendAlert.id}`,
          businessName,
          type: 'trend',
          severity: trendAlert.severity,
          title: trendAlert.title,
          message: trendAlert.message,
          data: {
            trend: trendAlert,
            ruleId: rule.id,
          },
          triggered: new Date(),
          acknowledged: false,
          emailSent: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Check comparison-based alerts
   */
  private async checkComparisonAlerts(
    reviews: Review[],
    businessName: string,
    rules: NotificationRule[]
  ): Promise<AnalysisAlert[]> {
    const alerts: AnalysisAlert[] = [];
    
    const comparisonRules = rules.filter(rule => rule.type === 'comparison' && rule.enabled);
    
    for (const rule of comparisonRules) {
      const period = rule.conditions.comparisonPeriod || 'month';
      const comparisonAlerts = await this.analyzeComparisons(reviews, businessName, period);
      
      // Filter by severity if specified
      const filteredAlerts = rule.conditions.severity 
        ? comparisonAlerts.filter(alert => rule.conditions.severity!.includes(alert.severity))
        : comparisonAlerts;

      alerts.push(...filteredAlerts);
    }

    return alerts;
  }

  /**
   * Analyze trends for potential alerts
   */
  private async analyzeTrends(
    reviews: Review[],
    businessName: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<TrendAlert[]> {
    const alerts: TrendAlert[] = [];
    
    // Generate comparison periods based on trend period
    const comparisons = generateComparisonPeriods(reviews);
    const relevantComparison = period === 'monthly' ? comparisons[1] : comparisons[0]; // 90-day or 30-day
    
    if (!relevantComparison) return alerts;

    const metrics = comparePeriods(relevantComparison.current, relevantComparison.previous);

    // Check for significant rating decline
    if (metrics.averageRating.trend === 'down' && Math.abs(metrics.averageRating.changePercent) > 10) {
      alerts.push({
        id: `trend-rating-${Date.now()}`,
        type: 'rating_decline',
        severity: Math.abs(metrics.averageRating.changePercent) > 20 ? 'critical' : 'high',
        title: 'Rating Decline Detected',
        message: `Average rating has decreased by ${Math.abs(metrics.averageRating.changePercent).toFixed(1)}% in the ${period} period`,
        currentValue: metrics.averageRating.current,
        previousValue: metrics.averageRating.previous,
        changePercent: metrics.averageRating.changePercent,
        threshold: 10,
        businessName,
        period,
        timestamp: new Date(),
      });
    }

    // Check for significant sentiment shift
    if (metrics.sentiment.changes.negative > 10) {
      alerts.push({
        id: `trend-sentiment-${Date.now()}`,
        type: 'sentiment_shift',
        severity: metrics.sentiment.changes.negative > 20 ? 'critical' : 'high',
        title: 'Negative Sentiment Increase',
        message: `Negative sentiment has increased by ${metrics.sentiment.changes.negative.toFixed(1)}% in the ${period} period`,
        currentValue: metrics.sentiment.current.negative,
        previousValue: metrics.sentiment.previous.negative,
        changePercent: metrics.sentiment.changes.negative,
        threshold: 10,
        businessName,
        period,
        timestamp: new Date(),
      });
    }

    // Check for significant volume change
    if (metrics.reviewCount.trend === 'down' && Math.abs(metrics.reviewCount.changePercent) > 25) {
      alerts.push({
        id: `trend-volume-${Date.now()}`,
        type: 'volume_change',
        severity: Math.abs(metrics.reviewCount.changePercent) > 50 ? 'critical' : 'medium',
        title: 'Review Volume Drop',
        message: `Review volume has decreased by ${Math.abs(metrics.reviewCount.changePercent).toFixed(1)}% in the ${period} period`,
        currentValue: metrics.reviewCount.current,
        previousValue: metrics.reviewCount.previous,
        changePercent: metrics.reviewCount.changePercent,
        threshold: 25,
        businessName,
        period,
        timestamp: new Date(),
      });
    }

    // Check for response rate drop
    if (metrics.responseRate.trend === 'down' && Math.abs(metrics.responseRate.change) > 15) {
      alerts.push({
        id: `trend-response-${Date.now()}`,
        type: 'response_drop',
        severity: Math.abs(metrics.responseRate.change) > 30 ? 'high' : 'medium',
        title: 'Response Rate Drop',
        message: `Response rate has decreased by ${Math.abs(metrics.responseRate.change).toFixed(1)}% in the ${period} period`,
        currentValue: metrics.responseRate.current,
        previousValue: metrics.responseRate.previous,
        changePercent: metrics.responseRate.change,
        threshold: 15,
        businessName,
        period,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Analyze comparisons for potential alerts
   */
  private async analyzeComparisons(
    reviews: Review[],
    businessName: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<AnalysisAlert[]> {
    const alerts: AnalysisAlert[] = [];
    
    const comparisons = generateComparisonPeriods(reviews);
    let relevantComparison;
    
    switch (period) {
      case 'week':
      case 'month':
        relevantComparison = comparisons[0]; // 30-day comparison
        break;
      case 'quarter':
        relevantComparison = comparisons[1]; // 90-day comparison
        break;
      case 'year':
        relevantComparison = comparisons[2]; // Year-over-year
        break;
    }
    
    if (!relevantComparison) return alerts;

    const metrics = comparePeriods(relevantComparison.current, relevantComparison.previous);

    // Check for competitive performance issues (significant declines across multiple metrics)
    const declineCount = [
      metrics.averageRating.trend === 'down',
      metrics.sentiment.changes.negative > 5,
      metrics.responseRate.trend === 'down',
      metrics.reviewCount.trend === 'down'
    ].filter(Boolean).length;

    if (declineCount >= 2) {
      alerts.push({
        id: `comparison-multi-${Date.now()}`,
        businessName,
        type: 'anomaly',
        severity: declineCount >= 3 ? 'critical' : 'high',
        title: 'Multiple Performance Declines',
        message: `${declineCount} key metrics are declining compared to the previous ${period}`,
        data: {
          comparison: metrics,
          period: relevantComparison.label,
        },
        triggered: new Date(),
        acknowledged: false,
        emailSent: false,
      });
    }

    return alerts;
  }

  /**
   * Process notifications for triggered alerts
   */
  private async processNotifications(
    alerts: AnalysisAlert[],
    businessName: string,
    businessType: BusinessType,
    emailSettings?: EmailSettings
  ): Promise<void> {
    const rules = await this.getNotificationRules(businessName);
    
    for (const alert of alerts) {
      // Find applicable rules based on alert data
      const applicableRules = rules.filter(rule => {
        if (!rule.enabled) return false;
        
        const ruleId = alert.data?.ruleId;
        return !ruleId || rule.id === ruleId;
      });

      // Process each rule's actions
      for (const rule of applicableRules) {
        for (const action of rule.actions) {
          try {
            await this.executeNotificationAction(action, alert, businessName, businessType, emailSettings);
          } catch (error) {
            console.error(`Failed to execute notification action:`, error);
          }
        }
      }
    }
  }

  /**
   * Execute a specific notification action
   */
  private async executeNotificationAction(
    action: NotificationAction,
    alert: AnalysisAlert,
    businessName: string,
    businessType: BusinessType,
    emailSettings?: EmailSettings
  ): Promise<void> {
    switch (action.type) {
      case 'email':
        await this.sendEmailNotification(action, alert, businessName, businessType, emailSettings);
        break;
      case 'dashboard_alert':
        // Dashboard alerts are handled by storing the alert
        break;
      case 'webhook':
        await this.sendWebhookNotification(action, alert, businessName);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    action: NotificationAction,
    alert: AnalysisAlert,
    businessName: string,
    businessType: BusinessType,
    emailSettings?: EmailSettings
  ): Promise<void> {
    if (!emailSettings?.enabled) return;

    const recipients = action.config.recipients || [emailSettings.recipient];
    
    for (const recipient of recipients) {
      const options: EmailOptions = {
        recipient,
        businessName,
        businessType,
        subject: `⚠️ ${alert.title} - ${businessName}`,
      };

      const issue = {
        title: alert.title,
        description: alert.message,
        impact: this.getSeverityDescription(alert.severity),
        recommendations: this.getRecommendationsForAlert(alert),
      };

      try {
        await sendUrgentAlert(options, issue);
        alert.emailSent = true;
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    action: NotificationAction,
    alert: AnalysisAlert,
    businessName: string
  ): Promise<void> {
    if (!action.config.webhookUrl) return;

    const payload = {
      business: businessName,
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.triggered.toISOString(),
      },
    };

    try {
      const response = await fetch(action.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Get severity description
   */
  private getSeverityDescription(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'Critical impact requiring immediate attention';
      case 'high':
        return 'High impact requiring urgent action';
      case 'medium':
        return 'Moderate impact requiring timely action';
      case 'low':
        return 'Low impact for awareness';
      default:
        return 'Impact assessment needed';
    }
  }

  /**
   * Get recommendations for alert
   */
  private getRecommendationsForAlert(alert: AnalysisAlert): string[] {
    const recommendations: string[] = [];
    
    switch (alert.type) {
      case 'performance':
        recommendations.push(
          'Review recent customer feedback for specific issues',
          'Analyze staff performance and training needs',
          'Consider adjusting service processes',
          'Respond to negative reviews promptly and professionally'
        );
        break;
      case 'trend':
        recommendations.push(
          'Investigate root causes of declining performance',
          'Implement corrective measures based on customer feedback',
          'Monitor trends more closely in the coming period',
          'Consider customer satisfaction surveys'
        );
        break;
      case 'anomaly':
        recommendations.push(
          'Conduct comprehensive performance review',
          'Identify and address systemic issues',
          'Develop action plan with specific timelines',
          'Increase monitoring frequency'
        );
        break;
    }
    
    return recommendations;
  }

  /**
   * Store alerts in history
   */
  private storeAlerts(businessName: string, alerts: AnalysisAlert[]): void {
    if (!this.alertHistory.has(businessName)) {
      this.alertHistory.set(businessName, []);
    }
    
    const history = this.alertHistory.get(businessName)!;
    history.push(...alerts);
    
    // Keep only last 100 alerts per business
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Get notification rules for a business
   */
  async getNotificationRules(businessName: string): Promise<NotificationRule[]> {
    // Check cache first
    if (this.notificationRules.has(businessName)) {
      return this.notificationRules.get(businessName)!;
    }

    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('business_name', businessName)
        .eq('enabled', true);

      if (error) {
        console.error('Error fetching notification rules:', error);
        return this.getDefaultNotificationRules(businessName);
      }

      const rules = (data || []).map(row => ({
        id: row.id,
        businessName: row.business_name,
        type: row.type,
        enabled: row.enabled,
        conditions: row.conditions,
        actions: row.actions,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      this.notificationRules.set(businessName, rules);
      return rules;
    } catch (error) {
      console.error('Error in getNotificationRules:', error);
      return this.getDefaultNotificationRules(businessName);
    }
  }

  /**
   * Get default notification rules
   */
  private getDefaultNotificationRules(businessName: string): NotificationRule[] {
    return [
      {
        id: `default-threshold-${businessName}`,
        businessName,
        type: 'threshold',
        enabled: true,
        conditions: {
          thresholds: DEFAULT_THRESHOLDS,
          severity: ['high', 'critical'],
        },
        actions: [
          {
            type: 'email',
            config: {},
          },
          {
            type: 'dashboard_alert',
            config: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `default-trend-${businessName}`,
        businessName,
        type: 'trend',
        enabled: true,
        conditions: {
          trendPeriod: 'weekly',
          severity: ['medium', 'high', 'critical'],
        },
        actions: [
          {
            type: 'dashboard_alert',
            config: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Get alert history for a business
   */
  getAlertHistory(businessName: string): AnalysisAlert[] {
    return this.alertHistory.get(businessName) || [];
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(businessName: string, alertId: string): boolean {
    const history = this.alertHistory.get(businessName);
    if (!history) return false;

    const alert = history.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    return true;
  }

  /**
   * Clear alert history for a business
   */
  clearAlertHistory(businessName: string): void {
    this.alertHistory.delete(businessName);
  }
}

// Export singleton instance
export const analysisNotificationService = AnalysisNotificationService.getInstance();
