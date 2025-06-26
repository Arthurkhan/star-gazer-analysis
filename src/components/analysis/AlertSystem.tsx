import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Settings,
  Bell,
  BellOff,
  TrendingDown,
  TrendingUp,
  Mail,
  Shield,
  Clock,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { Review } from '@/types/reviews'
import type { BusinessType } from '@/types/businessTypes'
import type {
  AnalysisAlert,
  NotificationRule} from '@/services/analysisNotificationService'
import {
  analysisNotificationService,
  NotificationConditions,
  NotificationAction,
} from '@/services/analysisNotificationService'
import type {
  PerformanceThresholds} from '@/utils/comparisonUtils'
import {
  DEFAULT_THRESHOLDS,
  ThresholdAlert,
} from '@/utils/comparisonUtils'

interface AlertSystemProps {
  reviews: Review[];
  businessName: string;
  businessType: BusinessType;
  onAlertClick?: (alert: AnalysisAlert) => void;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({
  reviews,
  businessName,
  businessType,
  onAlertClick,
}) => {
  const [alerts, setAlerts] = useState<AnalysisAlert[]>([])
  const [thresholds, setThresholds] = useState<PerformanceThresholds>(DEFAULT_THRESHOLDS)
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(false)
  const [showAcknowledged, setShowAcknowledged] = useState(false)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  useEffect(() => {
    loadAlerts()
    loadNotificationRules()
  }, [reviews, businessName])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const newAlerts = await analysisNotificationService.analyzeAndNotify(
        reviews,
        businessName,
        businessType,
      )

      const historyAlerts = analysisNotificationService.getAlertHistory(businessName)
      setAlerts(historyAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationRules = async () => {
    try {
      const rules = await analysisNotificationService.getNotificationRules(businessName)
      setNotificationRules(rules)
    } catch (error) {
      console.error('Error loading notification rules:', error)
    }
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    const success = analysisNotificationService.acknowledgeAlert(businessName, alertId)
    if (success) {
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ))
    }
  }

  const handleThresholdChange = (category: keyof PerformanceThresholds, level: 'critical' | 'warning', value: number) => {
    setThresholds(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [level]: value,
      },
    }))
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false
    return true
  })

  const activeAlerts = alerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high')

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <CardTitle>Performance Alert System</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={criticalAlerts.length > 0 ? 'destructive' : 'secondary'}>
              {activeAlerts.length} Active
            </Badge>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Alert System Configuration</DialogTitle>
                </DialogHeader>
                <AlertConfigurationPanel
                  thresholds={thresholds}
                  onThresholdChange={handleThresholdChange}
                  notificationRules={notificationRules}
                  businessName={businessName}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Critical</p>
                <p className="text-2xl font-bold text-red-900">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">High</p>
                <p className="text-2xl font-bold text-orange-900">{highAlerts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Active</p>
                <p className="text-2xl font-bold text-blue-900">{activeAlerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Acknowledged</p>
                <p className="text-2xl font-bold text-green-900">{alerts.filter(a => a.acknowledged).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Alert Filters */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={showAcknowledged}
              onCheckedChange={setShowAcknowledged}
            />
            <Label>Show acknowledged</Label>
          </div>
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={loadAlerts}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Refresh Alerts'}
          </Button>
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-600">All performance metrics are within acceptable thresholds.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                onClick={() => onAlertClick?.(alert)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AlertCardProps {
  alert: AnalysisAlert;
  onAcknowledge: () => void;
  onClick?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, onClick }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <Alert className={`${getSeverityColor(alert.severity)} cursor-pointer transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1" onClick={onClick}>
          {getSeverityIcon(alert.severity)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium">{alert.title}</h4>
              <Badge variant="outline" className="text-xs">
                {alert.type}
              </Badge>
              {alert.emailSent && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  Emailed
                </Badge>
              )}
            </div>
            <AlertDescription className="text-sm">
              {alert.message}
            </AlertDescription>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {alert.triggered.toLocaleString()}
              </span>
              {alert.data && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(!expanded)
                  }}
                  className="h-auto p-0 text-xs"
                >
                  {expanded ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {expanded ? 'Hide Details' : 'Show Details'}
                </Button>
              )}
            </div>
            {expanded && alert.data && (
              <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(alert.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        {!alert.acknowledged && (
          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onAcknowledge()
              }}
              variant="outline"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Acknowledge
            </Button>
          </div>
        )}
      </div>
    </Alert>
  )
}

interface AlertConfigurationPanelProps {
  thresholds: PerformanceThresholds;
  onThresholdChange: (category: keyof PerformanceThresholds, level: 'critical' | 'warning', value: number) => void;
  notificationRules: NotificationRule[];
  businessName: string;
}

const AlertConfigurationPanel: React.FC<AlertConfigurationPanelProps> = ({
  thresholds,
  onThresholdChange,
  notificationRules,
  businessName,
}) => {
  return (
    <Tabs defaultValue="thresholds" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
      </TabsList>

      <TabsContent value="thresholds" className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Performance Thresholds</h3>
          <div className="grid gap-6">
            {/* Rating Thresholds */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Average Rating</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating-critical" className="text-sm">Critical (below)</Label>
                  <Input
                    id="rating-critical"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={thresholds.rating.critical}
                    onChange={(e) => onThresholdChange('rating', 'critical', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="rating-warning" className="text-sm">Warning (below)</Label>
                  <Input
                    id="rating-warning"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={thresholds.rating.warning}
                    onChange={(e) => onThresholdChange('rating', 'warning', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Sentiment Thresholds */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Negative Sentiment (%)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sentiment-critical" className="text-sm">Critical (above)</Label>
                  <Input
                    id="sentiment-critical"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.sentimentNegative.critical}
                    onChange={(e) => onThresholdChange('sentimentNegative', 'critical', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sentiment-warning" className="text-sm">Warning (above)</Label>
                  <Input
                    id="sentiment-warning"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.sentimentNegative.warning}
                    onChange={(e) => onThresholdChange('sentimentNegative', 'warning', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Response Rate Thresholds */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Response Rate (%)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="response-critical" className="text-sm">Critical (below)</Label>
                  <Input
                    id="response-critical"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.responseRate.critical}
                    onChange={(e) => onThresholdChange('responseRate', 'critical', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="response-warning" className="text-sm">Warning (below)</Label>
                  <Input
                    id="response-warning"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.responseRate.warning}
                    onChange={(e) => onThresholdChange('responseRate', 'warning', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Volume Drop Thresholds */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Review Volume Drop (%)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="volume-critical" className="text-sm">Critical (above)</Label>
                  <Input
                    id="volume-critical"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.volumeDrop.critical}
                    onChange={(e) => onThresholdChange('volumeDrop', 'critical', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="volume-warning" className="text-sm">Warning (above)</Label>
                  <Input
                    id="volume-warning"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.volumeDrop.warning}
                    onChange={(e) => onThresholdChange('volumeDrop', 'warning', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure how and when you receive notifications about performance alerts.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive alerts via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">Dashboard Alerts</h4>
                <p className="text-sm text-gray-600">Show alerts in dashboard</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">Critical Alerts Only</h4>
                <p className="text-sm text-gray-600">Only notify for critical issues</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="rules" className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Rules</h3>
          <p className="text-sm text-gray-600 mb-4">
            Advanced rules for customizing alert behavior and notifications.
          </p>
          <div className="space-y-4">
            {notificationRules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{rule.type} Rule</h4>
                  <Switch checked={rule.enabled} />
                </div>
                <p className="text-sm text-gray-600">
                  {rule.type === 'threshold' && 'Triggers when performance metrics cross defined thresholds'}
                  {rule.type === 'trend' && 'Triggers when trends indicate declining performance'}
                  {rule.type === 'comparison' && 'Triggers when period comparisons show significant changes'}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Actions: {rule.actions.map(action => action.type).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Helper function for alert card styling
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'high':
      return 'bg-orange-50 border-orange-200 text-orange-800'
    case 'medium':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'low':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

// Helper function for alert severity icons
function getSeverityIcon(severity: string): React.ReactNode {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'high':
      return <AlertCircle className="w-4 h-4 text-orange-500" />
    case 'medium':
      return <Info className="w-4 h-4 text-yellow-500" />
    case 'low':
      return <CheckCircle className="w-4 h-4 text-blue-500" />
    default:
      return <Info className="w-4 h-4 text-gray-500" />
  }
}

export default AlertSystem
