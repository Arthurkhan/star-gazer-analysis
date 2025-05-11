
import { useState, useEffect } from "react";
import { FileEditIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Default prompt for review analysis
const DEFAULT_PROMPT = `Analyze these customer reviews:
[REVIEWS]

Please provide:
1. A sentiment breakdown with exact counts for positive, neutral, and negative reviews
2. A detailed list of staff members mentioned in the reviews with:
   - The exact name of each staff member as mentioned in reviews
   - The count of distinct mentions
   - Overall sentiment toward each staff member (positive/neutral/negative)
   - 2-3 exact quotes from reviews that mention each staff member
3. Common terms/themes mentioned in reviews with their frequency
4. A brief overall analysis of the review trends

IMPORTANT GUIDELINES FOR STAFF EXTRACTION:
- Only include actual staff members (people working at the business), not generic mentions like "staff" or "server"
- For each staff member, include exact quotes from reviews where they are mentioned
- If someone seems to be a customer rather than staff, do not include them
- If no staff are mentioned by name in any review, return an empty array for staffMentions
- Look very carefully for names of individual staff members in the review text`;

export function CustomPromptDialog() {
  const [prompt, setPrompt] = useState(localStorage.getItem("OPENAI_CUSTOM_PROMPT") || DEFAULT_PROMPT);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load saved prompt from localStorage on component mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem("OPENAI_CUSTOM_PROMPT");
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  const handleSavePrompt = () => {
    try {
      // Save custom prompt to localStorage
      localStorage.setItem("OPENAI_CUSTOM_PROMPT", prompt);
      
      toast({
        title: "Custom Prompt Saved",
        description: "Your custom analysis prompt has been saved successfully.",
      });
      
      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving custom prompt:", error);
      toast({
        title: "Error Saving Prompt",
        description: "There was an error saving your custom prompt.",
        variant: "destructive",
      });
    }
  };

  const handleResetPrompt = () => {
    setPrompt(DEFAULT_PROMPT);
    toast({
      title: "Prompt Reset",
      description: "The analysis prompt has been reset to default.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 text-xs"
        >
          <FileEditIcon size={14} />
          <span>Customize AI Prompt</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Customize AI Analysis Prompt</DialogTitle>
          <DialogDescription>
            Customize the prompt used for OpenAI review analysis. Use [REVIEWS] as a placeholder where the review data will be inserted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="custom-prompt">Analysis Prompt</Label>
            <Textarea
              id="custom-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={15}
              className="font-mono text-sm resize-y"
              placeholder="Enter your custom analysis prompt here..."
            />
            <p className="text-xs text-muted-foreground">
              Use [REVIEWS] as a placeholder where the review data will be inserted. 
              The prompt must instruct the AI to return a properly formatted JSON response.
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleResetPrompt}>
            Reset to Default
          </Button>
          <div>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="button" onClick={handleSavePrompt}>
              Save Prompt
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
