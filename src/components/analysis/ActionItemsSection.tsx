import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Eye,
  Target,
  Lightbulb,
  Star,
  Users,
} from 'lucide-react'
import type { ActionItems } from '@/types/analysisSummary'

interface ActionItemsSectionProps {
  actionItems: ActionItems;
}

export const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({
  actionItems,
}) => {
  const { urgent, improvements, strengths, monitoring } = actionItems

  // Helper to get priority color and icon
  const getPriorityInfo = (priority: 'critical' | 'high' | 'medium') => {
    switch (priority) {
      case 'critical':
        return { color: 'text-red-600 bg-red-100', icon: AlertTriangle, border: 'border-red-500' }
      case 'high':
        return { color: 'text-orange-600 bg-orange-100', icon: AlertTriangle, border: 'border-orange-500' }
      default:
        return { color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle, border: 'border-yellow-500' }
    }
  }

  // Helper to get impact/effort badges
  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getEffortColor = (effort: 'high' | 'medium' | 'low') => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-red-100 text-red-700'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Action Items & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Urgent Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Urgent Actions
            </h3>

            {urgent.length > 0 ? (
              <div className="space-y-3">
                {urgent.map((item, index) => {
                  const priorityInfo = getPriorityInfo(item.priority)
                  const PriorityIcon = priorityInfo.icon

                  return (
                    <Alert key={index} className={`${priorityInfo.border} border-l-4`}>
                      <PriorityIcon className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Affects {item.affectedReviews} review{item.affectedReviews !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge className={priorityInfo.color} variant="secondary">
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-sm">
                          <strong>Suggested Action:</strong> {item.suggestedAction}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p>No urgent actions required</p>
                <p className="text-sm">Your business is performing well!</p>
              </div>
            )}
          </div>

          {/* Improvement Opportunities */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Improvement Opportunities
            </h3>

            {improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.slice(0, 6).map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{item.area}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={getImpactColor(item.potentialImpact)} variant="secondary">
                            {item.potentialImpact} impact
                          </Badge>
                          <Badge className={getEffortColor(item.effort)} variant="secondary">
                            {item.effort} effort
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Suggested Actions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {item.suggestedActions.slice(0, 3).map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No specific improvements identified</p>
                <p className="text-sm">Continue current excellent practices</p>
              </div>
            )}
          </div>
        </div>

        {/* Strengths to Leverage */}
        {strengths.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-green-500" />
              Strengths to Leverage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strengths.map((strength, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4 space-y-2">
                    <h4 className="font-medium text-green-900">{strength.area}</h4>
                    <p className="text-sm text-muted-foreground">{strength.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-green-700">Leverage Opportunities:</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        {strength.leverageOpportunities.slice(0, 2).map((opportunity, oppIndex) => (
                          <li key={oppIndex} className="flex items-start gap-1">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics to Monitor */}
        {monitoring.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-purple-500" />
              Key Metrics to Monitor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monitoring.map((metric, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{metric.metric}</h4>
                      <Badge variant="outline" className="text-purple-600">
                        Monitor
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Value</p>
                        <p className="font-semibold">{metric.currentValue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target Value</p>
                        <p className="font-semibold text-purple-600">{metric.targetValue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Summary Message */}
        <div className="mt-6 pt-6 border-t">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Action Plan Summary</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>{urgent.length}</strong> urgent action{urgent.length !== 1 ? 's' : ''} requiring immediate attention
                  </p>
                  <p>
                    <strong>{improvements.length}</strong> improvement opportunit{improvements.length !== 1 ? 'ies' : 'y'} identified
                  </p>
                  <p>
                    <strong>{strengths.length}</strong> key strength{strengths.length !== 1 ? 's' : ''} to leverage for growth
                  </p>
                  {monitoring.length > 0 && (
                    <p>
                      <strong>{monitoring.length}</strong> metric{monitoring.length !== 1 ? 's' : ''} to monitor for ongoing success
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
