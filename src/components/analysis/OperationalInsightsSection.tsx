import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, Calendar, Users, Star } from "lucide-react";
import { OperationalInsights } from "@/types/analysisSummary";

interface OperationalInsightsSectionProps {
  operationalInsights: OperationalInsights;
}

export const OperationalInsightsSection: React.FC<OperationalInsightsSectionProps> = ({
  operationalInsights
}) => {
  const { languageDiversity, reviewPatterns, customerLoyalty } = operationalInsights;

  // Helper to get language flag emoji (simplified)
  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'English': '🇺🇸',
      'French': '🇫🇷',
      'Spanish': '🇪🇸',
      'German': '🇩🇪',
      'Italian': '🇮🇹',
      'Portuguese': '🇵🇹',
      'Dutch': '🇳🇱',
      'Russian': '🇷🇺',
      'Chinese': '🇨🇳',
      'Japanese': '🇯🇵',
      'Korean': '🇰🇷',
      'Thai': '🇹🇭',
      'Vietnamese': '🇻🇳',
      'Arabic': '🇸🇦',
      'Hindi': '🇮🇳'
    };
    return flags[language] || '🌍';
  };

  // Helper to format month names
  const formatMonth = (month: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(month);
    return months[monthNum - 1] || month;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Operational Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Language Diversity */}
          <div className="space-y-4">
            <h3 className="font-semibold">Language Diversity</h3>
            
            {languageDiversity.length > 0 ? (
              <div className="space-y-3">
                {languageDiversity.slice(0, 8).map((lang) => (
                  <div key={lang.language} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getLanguageFlag(lang.language)}</span>
                        <span className="font-medium">{lang.language}</span>
                      </div>
                      <Badge variant="secondary">
                        {lang.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={lang.percentage} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground min-w-[60px]">
                        {lang.count} reviews
                      </span>
                    </div>
                    {lang.averageRating > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{lang.averageRating.toFixed(1)} avg rating</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Language data not available</p>
              </div>
            )}

            {/* International Reach Summary */}
            {languageDiversity.length > 1 && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">International Appeal</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Languages:</span>
                    <span className="font-medium">{languageDiversity.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Language:</span>
                    <span className="font-medium">
                      {languageDiversity[0]?.language} ({languageDiversity[0]?.percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review Patterns */}
          <div className="space-y-4">
            <h3 className="font-semibold">Review Patterns</h3>
            
            <div className="space-y-4">
              {/* Peak Months */}
              {reviewPatterns.peakMonths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Peak Months</h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewPatterns.peakMonths.slice(0, 6).map((month) => (
                      <Badge key={month} variant="secondary" className="bg-green-100 text-green-700">
                        {formatMonth(month)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Peak Days */}
              {reviewPatterns.peakDays.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Peak Days</h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewPatterns.peakDays.map((day) => (
                      <Badge key={day} variant="secondary" className="bg-blue-100 text-blue-700">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiet Periods */}
              {reviewPatterns.quietPeriods.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Quiet Periods</h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewPatterns.quietPeriods.slice(0, 4).map((period) => (
                      <Badge key={period} variant="outline" className="text-muted-foreground">
                        {formatMonth(period)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonality Insights */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Seasonality Pattern</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {reviewPatterns.peakMonths.length > 0 ? (
                    <p>Business shows seasonal variation with peaks in {reviewPatterns.peakMonths.slice(0, 2).map(formatMonth).join(', ')}.</p>
                  ) : (
                    <p>Review patterns show consistent activity throughout the year.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Loyalty */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Loyalty</h3>
            
            <div className="space-y-4">
              {/* Repeat Reviewers */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Repeat Reviewers</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{customerLoyalty.repeatReviewers}</span>
                  <span className="text-sm text-muted-foreground">customers</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {customerLoyalty.repeatReviewers > 0 
                    ? "Customers who left multiple reviews"
                    : "No repeat reviewers detected yet"}
                </div>
              </div>

              {/* Loyalty Score */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Loyalty Score</h4>
                <div className="flex items-center gap-2">
                  <Progress value={customerLoyalty.loyaltyScore} className="flex-1 h-3" />
                  <span className="text-sm font-medium min-w-[40px]">
                    {customerLoyalty.loyaltyScore}/100
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {customerLoyalty.loyaltyScore >= 70 ? "High customer loyalty" :
                   customerLoyalty.loyaltyScore >= 40 ? "Moderate customer loyalty" :
                   "Growing customer base"}
                </div>
              </div>

              {/* Average Time Between Visits */}
              {customerLoyalty.averageTimeBetweenVisits && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Visit Frequency</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">{customerLoyalty.averageTimeBetweenVisits}</span>
                    <span className="text-sm text-muted-foreground">days avg</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average time between customer visits
                  </div>
                </div>
              )}

              {/* Customer Engagement Summary */}
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-900">Engagement Summary</span>
                </div>
                <div className="text-sm text-purple-800 space-y-1">
                  <p>
                    {languageDiversity.length > 1 
                      ? `International clientele (${languageDiversity.length} languages)`
                      : "Local customer base"}
                  </p>
                  <p>
                    {reviewPatterns.peakMonths.length > 0
                      ? `Seasonal business with ${reviewPatterns.peakMonths.length} peak months`
                      : "Consistent year-round activity"}
                  </p>
                  <p>
                    {customerLoyalty.loyaltyScore >= 50
                      ? "Strong customer retention"
                      : "Growing customer engagement"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
