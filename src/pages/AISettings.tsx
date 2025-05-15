import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AIServiceFactory, defaultConfigs } from '@/services/ai/aiServiceFactory';
import { AIProviderType } from '@/types/aiService';
import { Loader2, Check, X } from 'lucide-react';

const AISettings = () => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('openai');
  const [apiKeys, setApiKeys] = useState<Record<AIProviderType, string>>({
    openai: '',
    claude: '',
    gemini: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<AIProviderType, boolean | null>>({
    openai: null,
    claude: null,
    gemini: null
  });

  // Load saved settings on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('AI_PROVIDER') as AIProviderType;
    if (savedProvider) {
      setSelectedProvider(savedProvider);
    }

    const savedKeys: Record<AIProviderType, string> = {
      openai: localStorage.getItem('OPENAI_API_KEY') || '',
      claude: localStorage.getItem('CLAUDE_API_KEY') || '',
      gemini: localStorage.getItem('GEMINI_API_KEY') || ''
    };
    setApiKeys(savedKeys);
  }, []);

  const saveSettings = () => {
    // Save provider selection
    localStorage.setItem('AI_PROVIDER', selectedProvider);

    // Save API keys
    Object.entries(apiKeys).forEach(([provider, key]) => {
      if (key) {
        localStorage.setItem(`${provider.toUpperCase()}_API_KEY`, key);
      } else {
        localStorage.removeItem(`${provider.toUpperCase()}_API_KEY`);
      }
    });

    toast({
      title: 'Settings saved',
      description: 'Your AI provider settings have been updated'
    });
  };

  const testConnection = async (provider: AIProviderType) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) {
      toast({
        title: 'Missing API key',
        description: `Please enter an API key for ${provider}`,
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      const config = {
        provider,
        apiKey,
        ...defaultConfigs[provider]
      };

      const success = await AIServiceFactory.testProvider(config);
      setTestResults(prev => ({ ...prev, [provider]: success }));

      toast({
        title: success ? 'Connection successful' : 'Connection failed',
        description: success 
          ? `Successfully connected to ${provider}`
          : `Failed to connect to ${provider}. Please check your API key.`,
        variant: success ? 'default' : 'destructive'
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: false }));
      toast({
        title: 'Connection error',
        description: `Error testing ${provider}: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const providers: { value: AIProviderType; label: string; description: string }[] = [
    {
      value: 'openai',
      label: 'OpenAI (GPT-4)',
      description: 'Most advanced language model with excellent reasoning capabilities'
    },
    {
      value: 'claude',
      label: 'Anthropic (Claude)',
      description: 'Excellent for detailed analysis and creative solutions'
    },
    {
      value: 'gemini',
      label: 'Google (Gemini)',
      description: 'Fast and efficient for general business analysis'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Provider Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Default AI Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Select Provider</Label>
              <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as AIProviderType)}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {providers.find(p => p.value === selectedProvider)?.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {providers.map(provider => (
        <Card key={provider.value} className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{provider.label}</span>
              {testResults[provider.value] !== null && (
                <span className={`text-sm ${testResults[provider.value] ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults[provider.value] ? (
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Failed
                    </div>
                  )}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${provider.value}-key`}>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id={`${provider.value}-key`}
                    type="password"
                    placeholder={`Enter your ${provider.label} API key`}
                    value={apiKeys[provider.value]}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.value]: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => testConnection(provider.value)}
                    disabled={testing || !apiKeys[provider.value]}
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {provider.value === 'openai' && 'Get your API key from platform.openai.com'}
                  {provider.value === 'claude' && 'Get your API key from console.anthropic.com'}
                  {provider.value === 'gemini' && 'Get your API key from makersuite.google.com'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Alert className="mb-6">
        <AlertDescription>
          API keys are stored locally in your browser and never sent to our servers. 
          Make sure to keep them secure and don't share them with others.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={saveSettings}>Save Settings</Button>
      </div>
    </div>
  );
};

export default AISettings;
