import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AIServiceFactory, defaultConfigs } from '@/services/ai/aiServiceFactory';
import { AIProviderType } from '@/types/aiService';
import { Loader2, Check, X, ArrowLeft, Settings } from 'lucide-react';

// Model configurations for each provider
const providerModels: Record<AIProviderType, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1 (Latest generation)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Efficient)' },
    { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (Ultra-fast)' },
    { value: 'gpt-4o', label: 'GPT-4o (Most capable)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Faster, cheaper)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget option)' }
  ],
  claude: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most capable)' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Balanced)' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast & affordable)' }
  ],
  gemini: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Latest)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
    { value: 'gemini-pro', label: 'Gemini Pro' }
  ]
};

const AISettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('openai');
  const [apiKeys, setApiKeys] = useState<Record<AIProviderType, string>>({
    openai: '',
    claude: '',
    gemini: ''
  });
  const [selectedModels, setSelectedModels] = useState<Record<AIProviderType, string>>({
    openai: 'gpt-4o',
    claude: 'claude-3-opus-20240229',
    gemini: 'gemini-1.5-pro'
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

    // Load saved models
    const savedModels: Record<AIProviderType, string> = {
      openai: localStorage.getItem('OPENAI_MODEL') || 'gpt-4o',
      claude: localStorage.getItem('CLAUDE_MODEL') || 'claude-3-opus-20240229',
      gemini: localStorage.getItem('GEMINI_MODEL') || 'gemini-1.5-pro'
    };
    setSelectedModels(savedModels);
  }, []);

  // Back navigation handler
  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const saveSettings = () => {
    // Save provider selection
    localStorage.setItem('AI_PROVIDER', selectedProvider);

    // Save API keys and models
    Object.entries(apiKeys).forEach(([provider, key]) => {
      if (key) {
        localStorage.setItem(`${provider.toUpperCase()}_API_KEY`, key);
      } else {
        localStorage.removeItem(`${provider.toUpperCase()}_API_KEY`);
      }
    });

    // Save selected models
    Object.entries(selectedModels).forEach(([provider, model]) => {
      localStorage.setItem(`${provider.toUpperCase()}_MODEL`, model);
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
        model: selectedModels[provider],
        ...defaultConfigs[provider]
      };

      const success = await AIServiceFactory.testProvider(config);
      setTestResults(prev => ({ ...prev, [provider]: success }));

      toast({
        title: success ? 'Connection successful' : 'Connection failed',
        description: success 
          ? `Successfully connected to ${provider} with model ${selectedModels[provider]}`
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
      label: 'OpenAI',
      description: 'Most advanced language models with excellent reasoning capabilities'
    },
    {
      value: 'claude',
      label: 'Anthropic Claude',
      description: 'Excellent for detailed analysis and creative solutions'
    },
    {
      value: 'gemini',
      label: 'Google Gemini',
      description: 'Fast and efficient for general business analysis'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-muted-foreground" />
              <div>
                <h1 className="text-2xl font-bold">AI Provider Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Configure your AI providers and manage API keys
                </p>
              </div>
            </div>
          </div>
        </div>

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
                
                <div>
                  <Label htmlFor={`${provider.value}-model`}>Model</Label>
                  <Select 
                    value={selectedModels[provider.value]} 
                    onValueChange={(value) => setSelectedModels(prev => ({ ...prev, [provider.value]: value }))}
                  >
                    <SelectTrigger id={`${provider.value}-model`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providerModels[provider.value].map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the AI model to use for recommendations
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

        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={saveSettings}>Save Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AISettings;