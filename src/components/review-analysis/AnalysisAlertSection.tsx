
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface AnalysisAlertSectionProps {
  overallAnalysis: string;
  loading: boolean;
  error: string | null;
  aiProvider: string;
  aiModel: string;
}

const AnalysisAlertSection: React.FC<AnalysisAlertSectionProps> = ({ 
  overallAnalysis, 
  loading, 
  error, 
  aiProvider, 
  aiModel 
}) => {
  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Analysis Incomplete</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (overallAnalysis) {
    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>AI Analysis ({aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} {aiModel})</AlertTitle>
        <AlertDescription className="whitespace-pre-line prose prose-sm max-w-none">
          {overallAnalysis}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default AnalysisAlertSection;
