
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ApiKeyStatus() {
  const { toast } = useToast();
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "missing" | "present">("checking");

  useEffect(() => {
    // Check if the OpenAI API key is set
    const checkApiKey = async () => {
      try {
        // Check for API key in environment variables or localStorage
        const openAiKey = process.env.OPENAI_API_KEY || localStorage.getItem("OPENAI_API_KEY");
        
        if (!openAiKey) {
          setApiKeyStatus("missing");
          toast({
            title: "OpenAI API Key Missing",
            description: "The OpenAI API key is not set. Staff analysis and other AI features will not work.",
            variant: "destructive",
          });
        } else {
          setApiKeyStatus("present");
          toast({
            title: "OpenAI API Key Found",
            description: "The OpenAI API key is properly configured.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error checking API key:", error);
        setApiKeyStatus("missing");
      }
    };

    checkApiKey();
  }, [toast]);

  if (apiKeyStatus === "checking") {
    return (
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Checking OpenAI API Key Status</AlertTitle>
        <AlertDescription>Verifying API key configuration...</AlertDescription>
      </Alert>
    );
  }

  if (apiKeyStatus === "missing") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>OpenAI API Key Missing</AlertTitle>
        <AlertDescription>
          <p>The OpenAI API key is not set. Staff analysis and other AI features will not work.</p>
          <p className="mt-2">
            Please set your OpenAI API key using the key button in the header.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle>OpenAI API Key Configured</AlertTitle>
      <AlertDescription>
        The OpenAI API key is properly configured. AI-powered analysis features are available.
      </AlertDescription>
    </Alert>
  );
}
