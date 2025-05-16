import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck, MailIcon } from 'lucide-react';

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

interface EmailSettingsFormProps {
  businessName: string;
  businessType: string;
  initialSettings: EmailSettings;
}

export const EmailSettingsForm = ({
  businessName,
  businessType,
  initialSettings,
}: EmailSettingsFormProps) => {
  const [settings, setSettings] = useState<EmailSettings>(initialSettings);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage on component mount
    const storedSettings = localStorage.getItem(`emailSettings-${businessName}`);
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    } else {
      setSettings(initialSettings);
    }
  }, [businessName, initialSettings]);

  const saveSettings = useCallback(() => {
    // Save settings to localStorage
    localStorage.setItem(`emailSettings-${businessName}`, JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Email notification settings have been saved.",
    });
  }, [businessName, settings, toast]);

  const handleSettingsChange = (newSettings: EmailSettings) => {
    setSettings(newSettings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailIcon className="w-4 h-4 mr-2" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
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
          <p className="text-sm text-muted-foreground">
            Receive email notifications for important updates and recommendations.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Email</Label>
          <Input
            id="recipient"
            type="email"
            placeholder="Enter email address"
            value={settings.recipient}
            onChange={(e) =>
              handleSettingsChange({ ...settings, recipient: e.target.value })
            }
          />
          <p className="text-sm text-muted-foreground">
            The email address to send notifications to.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Schedule</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-enabled">Weekly Summary</Label>
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
          {settings.schedules.weekly.enabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="weekly-day">Day of the Week</Label>
              <Select
                value={settings.schedules.weekly.dayOfWeek.toString()}
                onValueChange={(value) =>
                  handleSettingsChange({
                    ...settings,
                    schedules: {
                      ...settings.schedules,
                      weekly: {
                        ...settings.schedules.weekly,
                        dayOfWeek: parseInt(value),
                      },
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {new Date(2023, 0, day).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="monthly-enabled">Monthly Summary</Label>
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
          {settings.schedules.monthly.enabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="monthly-day">Day of the Month</Label>
              <Select
                value={settings.schedules.monthly.dayOfMonth.toString()}
                onValueChange={(value) =>
                  handleSettingsChange({
                    ...settings,
                    schedules: {
                      ...settings.schedules,
                      monthly: {
                        ...settings.schedules.monthly,
                        dayOfMonth: parseInt(value),
                      },
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="urgent-enabled">Urgent Notifications</Label>
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
          {settings.schedules.urgent.enabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="urgent-severity">Minimum Severity</Label>
              <Select
                value={settings.schedules.urgent.minSeverity.toString()}
                onValueChange={(value) =>
                  handleSettingsChange({
                    ...settings,
                    schedules: {
                      ...settings.schedules,
                      urgent: {
                        ...settings.schedules.urgent,
                        minSeverity: parseInt(value),
                      },
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((severity) => (
                    <SelectItem key={severity} value={severity.toString()}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Content</h3>

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
            <Label htmlFor="include-recommendations">Include Recommendations</Label>
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

        <Button onClick={saveSettings} className="w-full">
          Save Settings
          <CheckCheck className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
