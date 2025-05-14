
import React, { useState, useEffect } from "react";
import { Review } from "@/types/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, ClipboardCopy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAnalysis, clearCache } from "@/utils/ai/analysisService";
import { CustomPromptDialog } from "@/components/CustomPromptDialog";
import { generatePDF } from "@/utils/pdfExport";

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface AIAnalysisReportProps {
  reviews: Review[];
  dateRange?: DateRange;
  title?: string;
  className?: string;
}

const AIAnalysisReport: React.FC<AIAnalysisReportProps> = ({ 
  reviews,
  dateRange,
  title = "AI Analysis Report", 
  className = ""
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingCustomPrompt, setUsingCustomPrompt] = useState(false);

  const fetchAnalysis = async (forceRefresh = false) => {
    if (reviews.length === 0) {
      setError("No reviews to analyze");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clear cache if forcing refresh
      if (forceRefresh) {
        clearCache();
      }

      // Get analysis from the service
      const result = await getAnalysis(reviews, dateRange ? {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to ? dateRange.to.toISOString() : new Date().toISOString()
      } : undefined);
      
      setAnalysis(result);
      // Check if custom prompt was used
      setUsingCustomPrompt(result.usingCustomPrompt || false);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to generate analysis. Please try again later.");
      toast({
        title: "Analysis failed",
        description: "Could not generate AI analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize analysis on first load
  useEffect(() => {
    if (reviews.length > 0 && !analysis && !loading) {
      fetchAnalysis();
    }
  }, [reviews, dateRange]);

  const copyToClipboard = () => {
    if (analysis?.overallAnalysis) {
      navigator.clipboard.writeText(analysis.overallAnalysis);
      toast({
        title: "Copied to clipboard",
        description: "Analysis copied to clipboard",
      });
    }
  };

  const downloadPDF = () => {
    if (analysis?.overallAnalysis) {
      generatePDF({
        title: `${title} - ${new Date().toLocaleDateString()}`,
        content: analysis.overallAnalysis,
        filename: `review-analysis-${new Date().toISOString().split('T')[0]}.pdf`
      });
      
      toast({
        title: "PDF downloaded",
        description: "Analysis report has been downloaded",
      });
    }
  };

  const renderFormattedAnalysis = () => {
    if (!analysis?.overallAnalysis) return null;

    // Split by sections (each section starts with an emoji)
    const sections = analysis.overallAnalysis.split(/(?=📊|📈|🗣️|💬|🌍|🎯)/g);
    
    return (
      <div className="space-y-4">
        {sections.map((section: string, index: number) => (
          <div key={index} className="space-y-2">
            <div 
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{ 
                __html: section
                  .replace(/\n/g, '<br />')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} 
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {usingCustomPrompt && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
              Custom Prompt
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard()}
                  disabled={!analysis?.overallAnalysis || loading}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy analysis to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => downloadPDF()}
                  disabled={!analysis?.overallAnalysis || loading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download as PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <CustomPromptDialog />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fetchAnalysis(true)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh analysis</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-muted-foreground">Analyzing reviews...</p>
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-4">
            {error}
          </div>
        ) : !analysis?.overallAnalysis ? (
          <div className="text-center text-muted-foreground py-4">
            <Button variant="outline" onClick={() => fetchAnalysis()}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Analysis
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {renderFormattedAnalysis()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisReport;
