import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import { saveEmailSettings, getEmailSettings } from '@/services/emailService'
import {
  BarChart3,
  Mail,
  Save,
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { BusinessType } from '@/types/businessTypes'

interface EmailSettings {
  enabled: boolean;
  recipient: string;
  schedules: {
    weekly: { enabled: boolean; dayOfWeek: number };
    monthly: { enabled: boolean; dayOfMonth: number };
    urgent: { enabled: boolean; minSeverity: number };
  };
  content: {
    includeCharts: boolean;
    includeRecommendations: boolean;
    includeTables: boolean;
  };
}

const defaultSettings: EmailSettings = {
  enabled: false,
  recipient: '',
  schedules: {
    weekly: { enabled: false, dayOfWeek: 1 },
    monthly: { enabled: false, dayOfMonth: 1 },
    urgent: { enabled: false, minSeverity: 3 },
  },
  content: {
    includeCharts: true,
    includeRecommendations: true,
    includeTables: true,
  },
}

interface EmailSettingsFormProps {
  businessName: string;
  businessType: BusinessType;
  initialSettings?: EmailSettings;
}

export const EmailSettingsForm: React.FC<EmailSettingsFormProps> = ({
  businessName,
  businessType,
  initialSettings,
}) => {
  const [settings, setSettings] = useState<EmailSettings>(initialSettings || defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      if (!businessName || businessName === 'all') return

      setLoading(true)
      try {
        const existingSettings = await getEmailSettings(businessName)
        if (existingSettings) {
          setSettings(existingSettings)
        }
      } catch (error) {
        console.error('Error fetching email settings:', error)
        toast({
          title: 'Error fetching settings',
          description: 'Could not load email notification settings.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [businessName, toast])

  const handleSettingsChange = (newSettings: EmailSettings) => {
    setSettings(newSettings)
  }

  const handleSaveSettings = async () => {
    if (!businessName || businessName === 'all') return

    setSaveLoading(true)
    try {
      await saveEmailSettings(businessName, settings)
      toast({
        title: 'Settings Saved',
        description: 'Email notification settings have been saved.',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error Saving Settings',
        description: 'Could not save email notification settings.',
        variant: 'destructive',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Configure email notifications for {businessName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-enabled">Enable Notifications</Label>
          <Switch
            id="email-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              handleSettingsChange({ ...settings, enabled: checked })
            }
          />
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email-recipient">Recipient Email</Label>
            <Input
              id="email-recipient"
              type="email"
              placeholder="Enter recipient email"
              value={settings.recipient}
              onChange={(e) =>
                handleSettingsChange({ ...settings, recipient: e.target.value })
              }
            />
          </div>
          <Separator />
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-enabled">Enable Weekly Report</Label>
                <Switch
                  id="weekly-enabled"
                  checked={settings.schedules.weekly.enabled}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        weekly: { ...settings.schedules.weekly, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weekly-day">Day of the Week</Label>
                <Select
                  value={settings.schedules.weekly.dayOfWeek.toString()}
                  onValueChange={(day) =>
                    handleSettingsChange({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        weekly: {
                          ...settings.schedules.weekly,
                          dayOfWeek: parseInt(day),
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger id="weekly-day">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="monthly" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthly-enabled">Enable Monthly Report</Label>
                <Switch
                  id="monthly-enabled"
                  checked={settings.schedules.monthly.enabled}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        monthly: { ...settings.schedules.monthly, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly-day">Day of the Month</Label>
                <Select
                  value={settings.schedules.monthly.dayOfMonth.toString()}
                  onValueChange={(day) =>
                    handleSettingsChange({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        monthly: {
                          ...settings.schedules.monthly,
                          dayOfMonth: parseInt(day),
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger id="monthly-day">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="urgent" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="urgent-enabled">Enable Urgent Notifications</Label>
                <Switch
                  id="urgent-enabled"
                  checked={settings.schedules.urgent.enabled}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        urgent: { ...settings.schedules.urgent, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="urgent-severity">Minimum Severity</Label>
                <Select
                  value={settings.schedules.urgent.minSeverity.toString()}
                  onValueChange={(severity) =>
                    handleSettingsChange({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        urgent: {
                          ...settings.schedules.urgent,
                          minSeverity: parseInt(severity),
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger id="urgent-severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Medium</SelectItem>
                    <SelectItem value="3">3 - High</SelectItem>
                    <SelectItem value="4">4 - Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          <Separator />
          <div className="space-y-2">
            <Label>Content to Include</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-charts">Include Charts</Label>
                <Switch
                  id="include-charts"
                  checked={settings.content.includeCharts}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({
                      ...settings,
                      content: { ...settings.content, includeCharts: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-recommendations">
                  Include Recommendations
                </Label>
                <Switch
                  id="include-recommendations"
                  checked={settings.content.includeRecommendations}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({
                      ...settings,
                      content: { ...settings.content, includeRecommendations: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-tables">Include Tables</Label>
                <Switch
                  id="include-tables"
                  checked={settings.content.includeTables}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({
                      ...settings,
                      content: { ...settings.content, includeTables: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={saveLoading}>
          {saveLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
