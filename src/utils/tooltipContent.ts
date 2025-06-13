/**
 * Centralized tooltip content for the Star-Gazer-Analysis app
 * 
 * This file contains all tooltip explanations for features, charts, graphs, and metrics
 * throughout the application. Content is organized by component/section for easy maintenance.
 */

export const tooltipContent = {
  // Dashboard Overview
  overview: {
    averageRating: "The average star rating from all customer reviews. Calculated by summing all ratings and dividing by the total number of reviews.",
    totalReviews: "The complete count of customer reviews received for this business across all time periods.",
    recentReviews: "Reviews posted within the last 30 days. Shows recent customer feedback and current business performance.",
    responseRate: "Percentage of reviews that received a response from the business owner. Higher rates show active customer engagement.",
    averageResponseTime: "Average time taken to respond to customer reviews. Faster responses indicate better customer service.",
    recentActivity: "Summary of review activity in the past 7 days, including new reviews and owner responses."
  },

  // Sentiment Analysis
  sentiment: {
    overall: "Overall emotional tone of reviews analyzed using AI. Ranges from very negative (-1) to very positive (+1).",
    positive: "Percentage of reviews with positive sentiment. Includes happy, satisfied, and enthusiastic customer feedback.",
    negative: "Percentage of reviews with negative sentiment. Includes complaints, dissatisfaction, and critical feedback.",
    neutral: "Percentage of reviews with neutral sentiment. Neither particularly positive nor negative feedback.",
    sentimentChart: "Visual breakdown of customer sentiment over time. Helps identify trends in customer satisfaction.",
    sentimentScore: "Numerical score representing the average emotional tone. Calculated using natural language processing."
  },

  // Rating Distribution
  ratings: {
    distribution: "Shows how reviews are spread across different star ratings (1-5 stars).",
    fiveStar: "Percentage of reviews with 5-star ratings. Indicates extremely satisfied customers.",
    fourStar: "Percentage of reviews with 4-star ratings. Generally satisfied with minor concerns.",
    threeStar: "Percentage of reviews with 3-star ratings. Mixed experiences or average satisfaction.",
    twoStar: "Percentage of reviews with 2-star ratings. Significantly dissatisfied customers.",
    oneStar: "Percentage of reviews with 1-star ratings. Very unhappy customers requiring immediate attention.",
    ratingTrend: "How average ratings have changed over time. Rising trends indicate improving customer satisfaction."
  },

  // Time-based Analysis
  temporal: {
    monthlyTrend: "Review volume and ratings grouped by month. Identifies seasonal patterns and growth trends.",
    weeklyPattern: "Distribution of reviews by day of week. Shows which days generate most customer feedback.",
    hourlyDistribution: "Reviews grouped by hour of day. Reveals peak customer activity times.",
    seasonalAnalysis: "Compares performance across seasons. Helps plan for busy periods and seasonal changes.",
    yearOverYear: "Compares current performance with the same period last year. Shows long-term growth or decline."
  },

  // Language Analysis
  language: {
    distribution: "Breakdown of reviews by detected language. Shows customer demographic diversity.",
    primaryLanguage: "The most common language used in reviews. Indicates primary customer base.",
    translationStatus: "Percentage of reviews that have been automatically translated for analysis.",
    languageTrend: "How language distribution has changed over time. Reveals shifting demographics."
  },

  // Theme Analysis
  themes: {
    topThemes: "Most frequently mentioned topics in reviews. Extracted using natural language processing.",
    themeFrequency: "How often each theme appears in reviews. Higher frequency indicates more important topics.",
    positivethemes: "Topics most associated with positive reviews. Represents business strengths.",
    negativeThemes: "Topics most associated with negative reviews. Areas needing improvement.",
    emergingThemes: "New topics appearing recently that weren't common before. Early indicators of change."
  },

  // Staff Performance
  staff: {
    mentionRate: "Percentage of reviews that mention specific staff members by name.",
    topPerformers: "Staff members receiving the most positive mentions in reviews.",
    performanceScore: "Average sentiment when this staff member is mentioned. Higher scores indicate better customer interactions.",
    staffImpact: "How staff mentions correlate with overall review ratings. Shows importance of staff quality."
  },

  // AI Recommendations
  recommendations: {
    urgentActions: "High-priority issues requiring immediate attention to prevent customer loss.",
    growthStrategies: "Data-driven suggestions for business expansion and increased revenue.",
    competitiveAnalysis: "How your business compares to similar establishments in the area.",
    marketingInsights: "Opportunities to attract new customers based on review analysis.",
    operationalImprovements: "Suggestions for improving day-to-day business operations.",
    futureProjections: "AI-predicted scenarios based on current trends and historical data."
  },

  // Period Comparison
  comparison: {
    periodSelector: "Choose time periods to compare. Helps identify improvement or decline over time.",
    growthRate: "Percentage change between selected periods. Positive values indicate growth.",
    performanceChange: "How key metrics have changed between periods. Includes ratings, volume, and sentiment.",
    comparisonChart: "Visual comparison of metrics across different time periods.",
    trendAnalysis: "Statistical analysis of whether changes are temporary fluctuations or lasting trends."
  },

  // Export Features
  export: {
    exportButton: "Download analysis data in various formats for presentations or further analysis.",
    formatOptions: "Choose between PDF for reports, Excel for data analysis, or CSV for raw data.",
    dateRange: "Select the time period to include in the export. Defaults to last 30 days.",
    includeCharts: "Option to include visual charts and graphs in the exported report."
  },

  // Email Notifications
  notifications: {
    emailFrequency: "How often to receive summary reports. Choose daily, weekly, or monthly updates.",
    alertThreshold: "Minimum rating that triggers an immediate alert. Helps catch problems quickly.",
    recipientList: "Email addresses that will receive notifications. Separate multiple addresses with commas.",
    notificationTypes: "Types of updates to receive: summaries, alerts, or both."
  },

  // Business Metrics
  metrics: {
    revenueImpact: "Estimated effect of review ratings on business revenue. Based on industry research.",
    customerLifetimeValue: "Predicted long-term value of customers based on their review behavior.",
    retentionRate: "Percentage of customers likely to return based on their review content.",
    netPromoterScore: "Likelihood of customers recommending your business. Based on review sentiment.",
    satisfactionRate: "Percentage of customers rating 4 or 5 stars. Indicates overall satisfaction level.",
    excellenceRate: "Percentage of 5-star reviews. Shows how often you exceed customer expectations.",
    healthScore: "Composite score (0-100) based on rating average, satisfaction rate, and response rate."
  },

  // Technical Indicators
  technical: {
    dataFreshness: "How recently the data was updated. Refreshes automatically every 24 hours.",
    apiStatus: "Current status of AI and data services. Green indicates all systems operational.",
    syncStatus: "Status of data synchronization with Google Maps. Shows last successful sync time.",
    processingTime: "Time taken to analyze and process review data. Faster times indicate better performance."
  },

  // Monthly Report specific
  monthlyReport: {
    reportPeriod: "Select specific date range for detailed analysis. Presets available for common periods.",
    dateRangePresets: "Quick selection options: Last 30 days, This month, Last month, or custom range.",
    totalReviewsInPeriod: "Count of reviews received during the selected date range only.",
    periodComparison: "Compares current period metrics with previous period and same period last year.",
    exportPDF: "Generate detailed PDF report including charts, metrics, and individual reviews.",
    exportExcel: "Export data to Excel for custom analysis. Includes all metrics and review details.",
    satisfactionRate: "Percentage of 4 and 5-star reviews. Formula: (4★ + 5★) ÷ Total Reviews × 100",
    excellenceRate: "Percentage of 5-star reviews only. Formula: 5★ ÷ Total Reviews × 100",
    healthScore: "Business health indicator. Formula: (Rating/5 × 40) + (Satisfaction × 0.35) + (Response × 0.25)",
    vsPreivousPeriod: "Comparison with the immediately preceding period of the same duration.",
    vsSamePeriodLastYear: "Year-over-year comparison with the same date range from previous year.",
    timeReviewsChart: "Interactive chart showing review distribution by day, week, or month.",
    viewMode: "Toggle between daily, weekly, or monthly view for time-based analysis.",
    aiAnalysisReport: "AI-generated insights and recommendations based on selected period data.",
    customPrompt: "Customize AI analysis with specific questions or focus areas."
  },

  // Business Comparison specific
  businessComparison: {
    overview: "Side-by-side comparison of all businesses showing key performance metrics.",
    monthlyTrend: "Review volume trends for each business over time. Identifies growth patterns.",
    cumulativeGrowth: "Total accumulated reviews showing overall growth trajectory for each business.",
    averageRating: "Average star rating comparison. Shows which business has highest customer satisfaction.",
    growthRate: "Month-over-month growth percentage. Positive means increasing reviews.",
    marketShare: "Percentage of total reviews each business receives. Shows relative popularity.",
    sentimentAnalysis: "Comparison of positive, neutral, and negative sentiment across businesses.",
    ratingDistribution: "Side-by-side view of how ratings are distributed for each business.",
    monthlyGrowthRate: "Percentage change in review count compared to previous month.",
    lastMonthReviews: "Number of reviews received in the most recent complete month.",
    previousMonthReviews: "Number of reviews received in the month before last.",
    sentimentBreakdown: "Percentage breakdown of emotional tone in reviews for each business.",
    competitivePosition: "How each business ranks compared to others in key metrics.",
    performanceTrends: "Long-term patterns showing if businesses are improving or declining."
  }
};

// Helper function to get tooltip content by path
export const getTooltip = (path: string): string => {
  const keys = path.split('.');
  let current: any = tooltipContent;
  
  for (const key of keys) {
    if (current[key]) {
      current = current[key];
    } else {
      return `Tooltip not found for: ${path}`;
    }
  }
  
  return typeof current === 'string' ? current : `Invalid tooltip path: ${path}`;
};
