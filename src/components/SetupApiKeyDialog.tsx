
import { useState, useEffect } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'

export function SetupApiKeyDialog() {
  const [apiProvider, setApiProvider] = useState(localStorage.getItem('AI_PROVIDER') || 'openai')
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiModel, setOpenaiModel] = useState(localStorage.getItem('OPENAI_MODEL') || 'gpt-4o-mini')
  const [anthropicModel, setAnthropicModel] = useState(localStorage.getItem('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307')
  const [geminiModel, setGeminiModel] = useState(localStorage.getItem('GEMINI_MODEL') || 'gemini-1.5-pro')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load saved API keys from localStorage on component mount
  useEffect(() => {
    const savedOpenaiKey = localStorage.getItem('OPENAI_API_KEY')
    if (savedOpenaiKey) {
      setOpenaiKey(savedOpenaiKey)
    }

    const savedAnthropicKey = localStorage.getItem('ANTHROPIC_API_KEY')
    if (savedAnthropicKey) {
      setAnthropicKey(savedAnthropicKey)
    }

    const savedGeminiKey = localStorage.getItem('GEMINI_API_KEY')
    if (savedGeminiKey) {
      setGeminiKey(savedGeminiKey)
    }
  }, [])

  const handleSaveApiKey = async () => {
    try {
      setLoading(true)

      // Save the selected provider to localStorage
      localStorage.setItem('AI_PROVIDER', apiProvider)

      // Save API keys using Supabase Edge Function Secrets
      if (apiProvider === 'openai' && openaiKey) {
        // Store in localStorage for UI display purposes
        localStorage.setItem('OPENAI_API_KEY', openaiKey)
        localStorage.setItem('OPENAI_MODEL', openaiModel)

        // Call Edge Function to set up the secret
        try {
          const { error } = await supabase.functions.invoke('analyze-reviews', {
            body: {
              action: 'test',
              provider: 'openai',
              apiKey: openaiKey,
            },
          })

          if (error) {
            throw new Error(`Error testing OpenAI API key: ${error.message}`)
          }
        } catch (error) {
          console.error('Error setting OpenAI API key:', error)
          toast({
            title: 'Error Setting OpenAI API Key',
            description: error.message,
            variant: 'destructive',
          })
        }
      } else if (apiProvider === 'anthropic' && anthropicKey) {
        localStorage.setItem('ANTHROPIC_API_KEY', anthropicKey)
        localStorage.setItem('ANTHROPIC_MODEL', anthropicModel)

        try {
          const { error } = await supabase.functions.invoke('analyze-reviews', {
            body: {
              action: 'test',
              provider: 'anthropic',
              apiKey: anthropicKey,
            },
          })

          if (error) {
            throw new Error(`Error testing Anthropic API key: ${error.message}`)
          }
        } catch (error) {
          console.error('Error setting Anthropic API key:', error)
          toast({
            title: 'Error Setting Anthropic API Key',
            description: error.message,
            variant: 'destructive',
          })
        }
      } else if (apiProvider === 'gemini' && geminiKey) {
        localStorage.setItem('GEMINI_API_KEY', geminiKey)
        localStorage.setItem('GEMINI_MODEL', geminiModel)

        try {
          const { error } = await supabase.functions.invoke('analyze-reviews', {
            body: {
              action: 'test',
              provider: 'gemini',
              apiKey: geminiKey,
            },
          })

          if (error) {
            throw new Error(`Error testing Gemini API key: ${error.message}`)
          }
        } catch (error) {
          console.error('Error setting Gemini API key:', error)
          toast({
            title: 'Error Setting Gemini API Key',
            description: error.message,
            variant: 'destructive',
          })
        }
      }

      toast({
        title: 'API Settings Saved',
        description: `Your ${apiProvider.charAt(0).toUpperCase() + apiProvider.slice(1)} settings have been saved successfully.`,
      })

      // Close the dialog
      setIsOpen(false)

      // Force a cache refresh for analysis
      localStorage.removeItem('analysis_cache_key')
    } catch (error) {
      console.error('Error saving API settings:', error)
      toast({
        title: 'Error Saving Settings',
        description: `There was an error saving your settings: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
        >
          <KeyRound className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup AI Provider</DialogTitle>
          <DialogDescription>
            Select your preferred AI provider and enter your API key to enable AI-powered analysis features.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={apiProvider} onValueChange={setApiProvider} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
          </TabsList>

          <TabsContent value="openai" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="openai-api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="openai-api-key"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Model
              </Label>
              <div className="col-span-3">
                <RadioGroup value={openaiModel} onValueChange={setOpenaiModel}>
                  <div className="space-y-3">
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2 text-sm">GPT-4o Series</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gpt-4o" id="gpt-4o" />
                          <Label htmlFor="gpt-4o" className="font-normal">GPT-4o</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gpt-4o-mini" id="gpt-4o-mini" />
                          <Label htmlFor="gpt-4o-mini" className="font-normal">GPT-4o Mini</Label>
                        </div>
                      </div>
                    </div>

                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2 text-sm">GPT-4.1 Series</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gpt-4.1" id="gpt-4.1" />
                          <Label htmlFor="gpt-4.1" className="font-normal">GPT-4.1</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gpt-4.1-mini" id="gpt-4.1-mini" />
                          <Label htmlFor="gpt-4.1-mini" className="font-normal">GPT-4.1 Mini</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gpt-4.1-nano" id="gpt-4.1-nano" />
                          <Label htmlFor="gpt-4.1-nano" className="font-normal">GPT-4.1 Nano</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="anthropic" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="anthropic-api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="anthropic-api-key"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk_ant-..."
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Model
              </Label>
              <div className="col-span-3">
                <RadioGroup value={anthropicModel} onValueChange={setAnthropicModel}>
                  <div className="space-y-3">
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2 text-sm">Claude 3 Series</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="claude-3-opus-20240229" id="claude-3-opus" />
                          <Label htmlFor="claude-3-opus" className="font-normal">Claude 3 Opus</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="claude-3-sonnet-20240229" id="claude-3-sonnet" />
                          <Label htmlFor="claude-3-sonnet" className="font-normal">Claude 3 Sonnet</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="claude-3-haiku-20240307" id="claude-3-haiku" />
                          <Label htmlFor="claude-3-haiku" className="font-normal">Claude 3 Haiku</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gemini" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gemini-api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="gemini-api-key"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AI..."
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Model
              </Label>
              <div className="col-span-3">
                <RadioGroup value={geminiModel} onValueChange={setGeminiModel}>
                  <div className="space-y-3">
                    <div className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2 text-sm">Gemini 1.5 Series</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gemini-1.5-pro" id="gemini-1.5-pro" />
                          <Label htmlFor="gemini-1.5-pro" className="font-normal">Gemini 1.5 Pro</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gemini-1.5-flash" id="gemini-1.5-flash" />
                          <Label htmlFor="gemini-1.5-flash" className="font-normal">Gemini 1.5 Flash</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" onClick={handleSaveApiKey} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
