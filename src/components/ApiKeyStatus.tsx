import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, CheckCircleIcon } from "lucide-react";

export function ApiKeyStatus() {
  const [status, setStatus] = useState<"ready" | "checking">("checking");

  useEffect(() => {
    // Since we no longer use external APIs, always show as ready
    setTimeout(() => {
      setStatus("ready");
    }, 500); // Small delay for visual feedback
  }, []);

  if (status === "checking") {
    return (
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Checking Analysis Status</AlertTitle>
        <AlertDescription>Preparing analysis tools...</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle>Analysis Ready</AlertTitle>
      <AlertDescription>
        Review analysis is available using pre-computed data. No API keys required.
      </AlertDescription>
    </Alert>
  );
}
