
import { useState, useEffect } from "react";
import { KeyRound, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function SetupApiKeyDialog() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(localStorage.getItem("OPENAI_MODEL") || "gpt-4o-mini");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("OPENAI_API_KEY");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    try {
      // Save API key to localStorage
      localStorage.setItem("OPENAI_API_KEY", apiKey);
      
      // Save selected model to localStorage
      localStorage.setItem("OPENAI_MODEL", model);
      
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });
      
      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error Saving API Key",
        description: "There was an error saving your API key.",
        variant: "destructive",
      });
    }
  };

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
          <DialogTitle>Setup OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable AI-powered analysis features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openai-api-key" className="text-right">
              API Key
            </Label>
            <Input
              id="openai-api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Model
            </Label>
            <div className="col-span-3">
              <RadioGroup value={model} onValueChange={setModel}>
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
              <p className="text-xs text-muted-foreground mt-2">
                Select your preferred OpenAI model for analysis.
                More powerful models may cost more but provide better insights.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSaveApiKey}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
