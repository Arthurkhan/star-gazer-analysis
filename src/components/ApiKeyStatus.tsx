
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { testApiKey } from "@/utils/ai/aiProviders";

export function ApiKeyStatus() {
  const { toast } = useToast();
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "missing" | "present">("checking");
  const [provider, setProvider] = useState<string>("");

  useEffect(() => {
    // Get the AI provider from localStorage
    const aiProvider = localStorage.getItem("AI_PROVIDER") || "openai";
    setProvider(aiProvider);
    
    // Check if the API key is set
    const checkApiKey = async () => {
      try {
        // First check if the key exists in localStorage
        const localKey = localStorage.getItem(`${aiProvider.toUpperCase()}_API_KEY`);
        
        if (!localKey) {
          setApiKeyStatus("missing");
          toast({
            title: `${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key Missing`,
            description: `The ${aiProvider} API key is not set. Analysis features will not work.`,
            variant: "destructive",
          });
          return;
        }
        
        // Try to call the Edge Function to verify the API key
        try {
          const isValid = await testApiKey(aiProvider);
          
          if (!isValid) {
            setApiKeyStatus("missing");
            toast({
              title: `${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key Error`,
              description: `Error verifying the ${aiProvider} API key.`,
              variant: "destructive",
            });
            return;
          }
          
          setApiKeyStatus("present");
          toast({
            title: `${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key Found`,
            description: `The ${aiProvider} API key is properly configured.`,
            variant: "default",
          });
        } catch (error) {
          console.error("Error verifying API key:", error);
          setApiKeyStatus("missing");
          toast({
            title: `${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key Error`,
            description: `Error verifying the ${aiProvider} API key: ${error.message}`,
            variant: "destructive",
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
        <AlertTitle>Checking {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key Status</AlertTitle>
        <AlertDescription>Verifying API key configuration...</AlertDescription>
      </Alert>
    );
  }

  if (apiKeyStatus === "missing") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>{provider.charAt(0).toUpperCase() + provider.slice(1)} API Key Missing</AlertTitle>
        <AlertDescription>
          <p>The {provider} API key is not set. Staff analysis and other AI features will not work.</p>
          <p className="mt-2">
            Please set your {provider.charAt(0).toUpperCase() + provider.slice(1)} API key using the key button in the header.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle>{provider.charAt(0).toUpperCase() + provider.slice(1)} API Key Configured</AlertTitle>
      <AlertDescription>
        The {provider} API key is properly configured. AI-powered analysis features are available.
      </AlertDescription>
    </Alert>
  );
}
