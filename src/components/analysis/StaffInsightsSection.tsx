import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Star } from "lucide-react";
import { StaffInsights } from "@/types/analysisSummary";

interface StaffInsightsSectionProps {
  staffInsights: StaffInsights;
}

export const StaffInsightsSection: React.FC<StaffInsightsSectionProps> = ({
  staffInsights
}) => {
  const { mentions, overallStaffScore, trainingOpportunities } = staffInsights;

  // Helper to get trend icon
  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving": return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "declining": return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  // Helper to calculate performance score
  const getPerformanceScore = (positive: number, negative: number, total: number) => {
    if (total === 0) return 0;
    return Math.round(((positive - negative) / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Staff Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Staff Mentions Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Staff Mentions</h3>
              <Badge variant="secondary">
                Overall Score: {overallStaffScore}/100
              </Badge>
            </div>
            
            {mentions.length > 0 ? (
              <div className="space-y-4">
                {mentions.slice(0, 6).map((staff) => {
                  const performanceScore = getPerformanceScore(
                    staff.positiveMentions, 
                    staff.negativeMentions, 
                    staff.totalMentions
                  );
                  
                  return (
                    <div key={staff.name} className="space-y-2 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.name}</span>
                          {getTrendIcon(staff.trend)}
                        </div>
                        <Badge 
                          variant={performanceScore > 50 ? "default" : "secondary"}
                          className={
                            performanceScore > 70 ? "bg-green-100 text-green-700" :
                            performanceScore > 30 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }
                        >
                          {performanceScore > 70 ? "Excellent" :
                           performanceScore > 30 ? "Good" : "Needs Support"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{staff.totalMentions}</div>
                          <div className="text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{staff.positiveMentions}</div>
                          <div className="text-muted-foreground">Positive</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{staff.negativeMentions}</div>
                          <div className="text-muted-foreground">Negative</div>
                        </div>
                      </div>

                      {staff.averageRatingInMentions > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{staff.averageRatingInMentions.toFixed(1)} avg rating</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No staff mentions found</p>
                <p className="text-sm">Staff mentions will appear as customers name team members</p>
              </div>
            )}
          </div>

          {/* Staff Examples and Training */}
          <div className="space-y-4">
            <h3 className="font-semibold">Performance Examples</h3>
            
            {mentions.length > 0 ? (
              <div className="space-y-4">
                {mentions.slice(0, 3).map((staff) => (
                  staff.examples.length > 0 && (
                    <div key={`${staff.name}-examples`} className="space-y-2">
                      <div className="font-medium text-sm">{staff.name}</div>
                      <div className="space-y-2">
                        {staff.examples.slice(0, 2).map((example, index) => (
                          <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                            "{example.length > 150 ? example.substring(0, 150) + '...' : example}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : null}

            {/* Training Opportunities */}
            {trainingOpportunities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Training Opportunities</h4>
                <div className="space-y-1">
                  {trainingOpportunities.map((opportunity, index) => (
                    <div key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                      {opportunity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Performance Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm mb-2">Performance Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Staff Members Mentioned:</span>
                  <span className="font-medium">{mentions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Staff Mentions:</span>
                  <span className="font-medium">
                    {mentions.reduce((sum, staff) => sum + staff.totalMentions, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Positive Ratio:</span>
                  <span className="font-medium text-green-600">
                    {mentions.length > 0 ? 
                      Math.round((mentions.reduce((sum, staff) => sum + staff.positiveMentions, 0) / 
                                 mentions.reduce((sum, staff) => sum + staff.totalMentions, 0)) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
