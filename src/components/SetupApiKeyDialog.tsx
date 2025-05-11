
import { useState } from "react";
import { KeyIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SetupApiKeyDialog() {
  const [apiKey, setApiKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem("OPENAI_MODEL") || "gpt-4o-mini");
  const { toast } = useToast();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test the API key with a simple request to OpenAI
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API key validation error:", errorText);
        throw new Error(`Invalid API key: ${response.status} ${errorText}`);
      }

      // Store the API key and selected model in local storage
      localStorage.setItem("OPENAI_API_KEY", apiKey);
      localStorage.setItem("OPENAI_MODEL", selectedModel);

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });
      
      // Close the dialog
      setIsOpen(false);
      
      // Reload the page to apply the new API key
      window.location.reload();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Invalid API Key",
        description: "Please check your OpenAI API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          aria-label="Setup OpenAI API Key"
        >
          <KeyIcon size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable AI features. Your key will be stored securely in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can find your API key in the{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                OpenAI dashboard
              </a>
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mt-2">
            <Label htmlFor="model-select">OpenAI Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (Powerful & Comprehensive)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the OpenAI model to use for review analysis.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveApiKey} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
