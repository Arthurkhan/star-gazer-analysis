
import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export function CustomPromptDialog() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Load current prompt when dialog opens
  const loadCurrentPrompt = async () => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('analyze-reviews', {
        body: {
          action: 'get-prompt',
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data && data.prompt) {
        setCustomPrompt(data.prompt)
      }
    } catch (error) {
      console.error('Error loading custom prompt:', error)
      // Just use default prompt if we can't load
    } finally {
      setIsLoading(false)
    }
  }

  // Save custom prompt
  const saveCustomPrompt = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.functions.invoke('analyze-reviews', {
        body: {
          action: 'set-prompt',
          prompt: customPrompt,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: 'Custom Prompt Saved',
        description: 'Your custom prompt has been saved and will be used for future analyses.',
      })

      setOpen(false)
    } catch (error) {
      console.error('Error saving custom prompt:', error)

      toast({
        title: 'Error Saving Prompt',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        loadCurrentPrompt()
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <Settings size={14} />
          <span>Custom Prompt</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Customize AI Analysis Prompt</DialogTitle>
          <DialogDescription>
            Customize how the AI analyzes your reviews. Use [REVIEWS] as a placeholder for your review data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Analysis Prompt</Label>
              <Textarea
                id="prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Analyze these [REVIEWS] and provide sentiment analysis, staff mentions, and common themes..."
                className="min-h-[200px]"
              />
            </div>

            <div className="text-sm text-gray-500">
              <p className="font-medium">Tips:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use [REVIEWS] to indicate where your review data should be inserted</li>
                <li>Be specific about what insights you want the AI to extract</li>
                <li>Leave blank to use the default prompt</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={saveCustomPrompt}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Prompt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
