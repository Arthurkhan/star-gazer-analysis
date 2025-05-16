import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangleIcon, 
  ChartBarIcon, 
  CheckIcon, 
  ClockIcon, 
  Loader2Icon,
  MailIcon,
  SaveIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { BusinessType } from '@/types/businessTypes';
import { supabase } from '@/integrations/supabase/client';

interface EmailSettings {
  enabled: boolean;
  recipient: string;
  schedules: {
    weekly: {
      enabled: boolean;
      dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Monday = 1, Sunday = 7
    };
    monthly: {
      enabled: boolean;
      dayOfMonth: number;
    };
    urgent: {
      enabled: boolean;
      minSeverity: number; // 1-5 scale
    };
  };
  content: {
    includeCharts: boolean;
    includeRecommendations: boolean;
    includeTables: boolean;
  };
}

interface EmailSettingsFormProps {
  businessName: string;
  businessType: BusinessType;
  initialSettings?: Partial<EmailSettings>;
  onSaved?: (settings: EmailSettings) => void;
}

export function EmailSettingsForm({
  businessName,
  businessType,
  initialSettings,
  onSaved
}: EmailSettingsFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSend, setIsTestingSend] = useState(false);
  
  // Default settings
  const defaultSettings: EmailSettings = {
    enabled: true,
    recipient: '',
    schedules: {
      weekly: {
        enabled: true,
        dayOfWeek: 1 // Monday
      },
      monthly: {
        enabled: true,
        dayOfMonth: 1
      },
      urgent: {
        enabled: true,
        minSeverity: 3
      }
    },
    content: {
      includeCharts: true,
      includeRecommendations: true,
      includeTables: true
    }
  };
  
  // Merge default settings with initial settings if provided
  const [settings, setSettings] = useState<EmailSettings>({
    ...defaultSettings,
    ...initialSettings
  });
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validate email
      if (!settings.recipient || !validateEmail(settings.recipient)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address.',
          variant: 'destructive'
        });
        return;
      }
      
      // Save settings to Supabase or localStorage
      const businessKey = businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      // Save to local storage as fallback
      localStorage.setItem(`emailSettings_${businessKey}`, JSON.stringify(settings));
      
      // Try to save to Supabase if available
      try {
        const { error } = await supabase
          .from('email_settings')
          .upsert({
            business_name: businessName,
            business_type: businessType,
            settings: settings,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'business_name'
          });
          
        if (error) throw error;
      } catch (error) {
        console.error('Failed to save to Supabase:', error);
        // Continue since we've saved to localStorage as fallback
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Your email notification settings have been saved.',
        variant: 'default'
      });
      
      if (onSaved) {
        onSaved(settings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error Saving Settings',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestEmail = async () => {
    setIsTestingSend(true);
    
    try {
      // Validate email
      if (!settings.recipient || !validateEmail(settings.recipient)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address.',
          variant: 'destructive'
        });
        return;
      }
      
      // Send test email using the send-email-summary edge function
      const { data, error } = await supabase.functions.invoke('send-email-summary', {
        body: {
          recipient: settings.recipient,
          subject: `Test Email - ${businessName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #4A6FFF; color: white; padding: 15px; text-align: center;">
                <h1 style="margin: 0;">Test Email</h1>
                <p style="margin: 5px 0 0 0;">${businessName}</p>
              </div>
              
              <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                <h2>Email Notification Test</h2>
                <p>This is a test email to confirm that your notification settings are working correctly.</p>
                <p>Your email settings have been configured for:</p>
                <ul>
                  <li><strong>Weekly Reports:</strong> ${settings.schedules.weekly.enabled ? 'Enabled' : 'Disabled'}</li>
                  <li><strong>Monthly Reports:</strong> ${settings.schedules.monthly.enabled ? 'Enabled' : 'Disabled'}</li>
                  <li><strong>Urgent Alerts:</strong> ${settings.schedules.urgent.enabled ? 'Enabled' : 'Disabled'}</li>
                </ul>
                <p>If you received this email, your notification system is working correctly.</p>
                
                <div style="margin-top: 30px; text-align: center;">
                  <p>You're all set! You'll start receiving notifications based on your settings.</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
                  <p>This email was sent from Star-Gazer Analysis.</p>
                </div>
              </div>
            </div>
          `,
          includeAttachments: false
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Test Email Sent',
        description: `A test email has been sent to ${settings.recipient}.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Email Sending Failed',
        description: 'Failed to send test email. Please check your email configuration.',
        variant: 'destructive'
      });
    } finally {
      setIsTestingSend(false);
    }
  };
  
  // Helper function to validate email
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  
  // Day of week options for the weekly schedule
  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' }
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Configure when and how you receive email notifications for {businessName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications-enabled">Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications based on your schedule settings
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    enabled: checked
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-recipient">Email Recipient</Label>
                <Input
                  id="email-recipient"
                  placeholder="your@email.com"
                  disabled={!settings.enabled}
                  value={settings.recipient}
                  onChange={(e) => setSettings({
                    ...settings,
                    recipient: e.target.value
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  All notifications will be sent to this email address
                </p>
              </div>
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  disabled={!settings.enabled || isTestingSend || !settings.recipient} 
                  onClick={handleTestEmail}
                >
                  {isTestingSend ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MailIcon className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            <div className="space-y-6">
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Weekly Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive a summary of review activity each week
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.schedules.weekly.enabled}
                    disabled={!settings.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        weekly: {
                          ...settings.schedules.weekly,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                
                {settings.schedules.weekly.enabled && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weekly-day">Send On</Label>
                      <select
                        id="weekly-day"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={settings.schedules.weekly.dayOfWeek}
                        onChange={(e) => setSettings({
                          ...settings,
                          schedules: {
                            ...settings.schedules,
                            weekly: {
                              ...settings.schedules.weekly,
                              dayOfWeek: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7
                            }
                          }
                        })}
                      >
                        {daysOfWeek.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Monthly Report</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive a comprehensive report each month
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.schedules.monthly.enabled}
                    disabled={!settings.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        monthly: {
                          ...settings.schedules.monthly,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                
                {settings.schedules.monthly.enabled && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthly-day">Day of Month</Label>
                      <select
                        id="monthly-day"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={settings.schedules.monthly.dayOfMonth}
                        onChange={(e) => setSettings({
                          ...settings,
                          schedules: {
                            ...settings.schedules,
                            monthly: {
                              ...settings.schedules.monthly,
                              dayOfMonth: parseInt(e.target.value)
                            }
                          }
                        })}
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                    <div>
                      <h4 className="font-medium">Urgent Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts for urgent issues requiring immediate attention
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.schedules.urgent.enabled}
                    disabled={!settings.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      schedules: {
                        ...settings.schedules,
                        urgent: {
                          ...settings.schedules.urgent,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                
                {settings.schedules.urgent.enabled && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="urgency-level">Minimum Severity Level</Label>
                      <select
                        id="urgency-level"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={settings.schedules.urgent.minSeverity}
                        onChange={(e) => setSettings({
                          ...settings,
                          schedules: {
                            ...settings.schedules,
                            urgent: {
                              ...settings.schedules.urgent,
                              minSeverity: parseInt(e.target.value)
                            }
                          }
                        })}
                      >
                        <option value="1">1 - Low</option>
                        <option value="2">2 - Medium-Low</option>
                        <option value="3">3 - Medium</option>
                        <option value="4">4 - Medium-High</option>
                        <option value="5">5 - High</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only receive alerts for issues with severity equal to or higher than this level
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-charts">Include Charts</Label>
                  <p className="text-sm text-muted-foreground">
                    Include visual charts and graphs in email reports
                  </p>
                </div>
                <Switch
                  id="include-charts"
                  disabled={!settings.enabled}
                  checked={settings.content.includeCharts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    content: {
                      ...settings.content,
                      includeCharts: checked
                    }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-tables">Include Tables</Label>
                  <p className="text-sm text-muted-foreground">
                    Include data tables in email reports
                  </p>
                </div>
                <Switch
                  id="include-tables"
                  disabled={!settings.enabled}
                  checked={settings.content.includeTables}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    content: {
                      ...settings.content,
                      includeTables: checked
                    }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-recommendations">Include Recommendations</Label>
                  <p className="text-sm text-muted-foreground">
                    Include AI-generated recommendations in email reports
                  </p>
                </div>
                <Switch
                  id="include-recommendations"
                  disabled={!settings.enabled}
                  checked={settings.content.includeRecommendations}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    content: {
                      ...settings.content,
                      includeRecommendations: checked
                    }
                  })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setSettings(defaultSettings)}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default EmailSettingsForm;
