/**
 * STAR-GAZER-ANALYSIS: Staff Performance Insights Component
 * 
 * A comprehensive component for displaying staff performance metrics and insights
 * based on customer review mentions. Shows individual staff performance scores,
 * trends, examples, and training opportunities.
 * 
 * Features:
 * - Individual staff performance scores with positive/negative mention tracking
 * - Performance trend indicators (improving/declining/stable)
 * - Average rating per staff member
 * - Scrollable list for multiple staff members
 * - Performance examples from actual reviews
 * - Training opportunity identification
 * - Overall team performance summary
 * 
 * Adaptation Guide:
 * 1. Replace the StaffInsights interface with your data structure
 * 2. Adjust the performance score calculation logic if needed
 * 3. Customize the performance categories (Excellent/Good/Needs Support)
 * 4. Modify the color schemes to match your branding
 * 5. Update the scroll threshold (currently set to 6 staff members)
 * 6. Customize the training opportunities section
 * 
 * Dependencies:
 * - @/components/ui/card (shadcn/ui)
 * - @/components/ui/badge (shadcn/ui)
 * - @/components/ui/scroll-area (shadcn/ui)
 * - lucide-react
 * 
 * Responsive Design:
 * - Desktop: 2-column layout (staff list + examples/training)
 * - Mobile: Single column stacked layout
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, TrendingUp, TrendingDown, Star } from 'lucide-react'

// Type Definitions
interface StaffMention {
  name: string;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  trend: 'improving' | 'declining' | 'stable';
  averageRatingInMentions: number;
  examples: string[];
}

interface StaffInsights {
  mentions: StaffMention[];
  overallStaffScore: number;
  trainingOpportunities: string[];
}

interface StaffInsightsSectionProps {
  staffInsights: StaffInsights;
}

// Main Component
export const StaffInsightsSection: React.FC<StaffInsightsSectionProps> = ({
  staffInsights,
}) => {
  const { mentions, overallStaffScore, trainingOpportunities } = staffInsights

  // Helper to get trend icon
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'declining': return <TrendingDown className="w-3 h-3 text-red-500" />
      default: return null
    }
  }

  // Helper to calculate performance score
  const getPerformanceScore = (positive: number, negative: number, total: number) => {
    if (total === 0) return 0
    return Math.round(((positive - negative) / total) * 100)
  }

  // Staff Member Card Component
  const StaffMemberCard = ({ staff }: { staff: StaffMention }) => {
    const performanceScore = getPerformanceScore(
      staff.positiveMentions,
      staff.negativeMentions,
      staff.totalMentions,
    )

    return (
      <div className="space-y-2 p-3 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{staff.name}</span>
            {getTrendIcon(staff.trend)}
          </div>
          <Badge
            variant={performanceScore > 50 ? 'default' : 'secondary'}
            className={
              performanceScore > 70 ? 'bg-green-100 text-green-700' :
              performanceScore > 30 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }
          >
            {performanceScore > 70 ? 'Excellent' :
             performanceScore > 30 ? 'Good' : 'Needs Support'}
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
    )
  }

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
                {/* Show scrollable area if more than 6 staff members */}
                {mentions.length > 6 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Showing all {mentions.length} staff members
                    </p>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {mentions.map((staff) => (
                          <StaffMemberCard key={staff.name} staff={staff} />
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  // Show all staff without scroll if 6 or fewer
                  <div className="space-y-4">
                    {mentions.map((staff) => (
                      <StaffMemberCard key={staff.name} staff={staff} />
                    ))}
                  </div>
                )}
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
                            "{example.length > 150 ? `${example.substring(0, 150)}...` : example}"
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
  )
}

// Example usage with sample data
export const StaffPerformanceExample = () => {
  const sampleData: StaffInsights = {
    mentions: [
      {
        name: "Sarah Johnson",
        totalMentions: 45,
        positiveMentions: 38,
        negativeMentions: 7,
        trend: 'improving',
        averageRatingInMentions: 4.6,
        examples: [
          "Sarah was incredibly helpful and made my experience wonderful!",
          "Great service from Sarah, she went above and beyond."
        ]
      },
      {
        name: "Mike Chen",
        totalMentions: 32,
        positiveMentions: 20,
        negativeMentions: 12,
        trend: 'stable',
        averageRatingInMentions: 3.8,
        examples: [
          "Mike was okay but seemed a bit rushed.",
          "Good knowledge from Mike about the products."
        ]
      },
      {
        name: "Emma Wilson",
        totalMentions: 28,
        positiveMentions: 26,
        negativeMentions: 2,
        trend: 'improving',
        averageRatingInMentions: 4.9,
        examples: [
          "Emma is amazing! Always friendly and professional.",
          "Best service I've ever received, thanks Emma!"
        ]
      },
    ],
    overallStaffScore: 82,
    trainingOpportunities: [
      "Time management training for peak hours",
      "Customer engagement techniques for newer staff",
      "Product knowledge refresh for seasonal items"
    ]
  }

  return <StaffInsightsSection staffInsights={sampleData} />
}

/**
 * Customization Options:
 * 
 * 1. Performance Thresholds:
 *    - Excellent: > 70% positive score
 *    - Good: 30-70% positive score
 *    - Needs Support: < 30% positive score
 * 
 * 2. Scroll Behavior:
 *    - Activates when more than 6 staff members
 *    - Height: 500px (adjustable)
 * 
 * 3. Example Truncation:
 *    - Review examples truncated at 150 characters
 *    - Shows up to 2 examples per staff member
 *    - Shows examples for top 3 staff members only
 * 
 * 4. Color Coding:
 *    - Green: Positive metrics/improving trends
 *    - Yellow: Neutral/stable performance
 *    - Red: Negative metrics/declining trends
 * 
 * 5. Training Opportunities:
 *    - Displayed with yellow accent
 *    - Border-left style for emphasis
 */