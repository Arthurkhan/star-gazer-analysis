
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOverallAnalysis } from "@/utils/dataUtils";
import { Review } from "@/types/reviews";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiAnalysisCardProps {
  selectedReviews: Review[];
  aiAnalysis: string;
  setAiAnalysis: (analysis: string) => void;
  isAnalysisLoading: boolean;
  setIsAnalysisLoading: (loading: boolean) => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
}

export function AiAnalysisCard({
  selectedReviews,
  aiAnalysis,
  setAiAnalysis,
  isAnalysisLoading,
  setIsAnalysisLoading,
  analysisError,
  setAnalysisError
}: AiAnalysisCardProps) {
  // Handle refresh analysis
  const handleRefreshAnalysis = async () => {
    if (selectedReviews.length === 0) {
      setAnalysisError("No reviews available for analysis in the selected date range.");
      return;
    }
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      // Clear analysis cache to force a fresh analysis
      localStorage.removeItem("analysis_cache_key");
      
      const analysis = await getOverallAnalysis(selectedReviews);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setAnalysisError("Could not retrieve AI analysis. Please try again later.");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Get the AI provider and model information
  const aiProvider = localStorage.getItem("AI_PROVIDER") || "openai";
  let aiModel = "";
  
  switch (aiProvider) {
    case "openai":
      aiModel = localStorage.getItem("OPENAI_MODEL") || "gpt-4o-mini";
      break;
    case "anthropic":
      aiModel = localStorage.getItem("ANTHROPIC_MODEL") || "claude-3-haiku-20240307";
      break;
    case "gemini":
      aiModel = localStorage.getItem("GEMINI_MODEL") || "gemini-1.5-flash";
      break;
  }

  // Only trigger analysis when there's a significant change in reviews
  // Using a ref to store previous review set length to compare
  const [previousReviewCount, setPreviousReviewCount] = useState(0);
  
  useEffect(() => {
    // Only fetch analysis if the review count has changed significantly
    // or if we don't have an analysis yet but have reviews
    if (
      (selectedReviews.length > 0 && Math.abs(selectedReviews.length - previousReviewCount) > 5) || 
      (selectedReviews.length > 0 && !aiAnalysis && !isAnalysisLoading)
    ) {
      setPreviousReviewCount(selectedReviews.length);
      handleRefreshAnalysis();
    } else if (selectedReviews.length === 0) {
      setAiAnalysis("");
      setPreviousReviewCount(0);
    }
  }, [selectedReviews.length]);

  // Function to format the analysis for display
  const formatAnalysisForDisplay = (analysis: string) => {
    if (!analysis) return null;
    
    // Split sections by emoji headers
    const sections = analysis.split(/\n\n(?=📊|📈|🗣️|💬|🌍|🎯)/g);
    
    return sections.map((section, index) => {
      // Check if the section has an emoji header
      const hasEmojiHeader = /^(📊|📈|🗣️|💬|🌍|🎯)/.test(section.trim());
      
      if (!hasEmojiHeader) return <p key={index} className="mb-4">{section}</p>;
      
      // Get the section title
      const [title, ...content] = section.split('\n');
      
      return (
        <div key={index} className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <div className="pl-4">
            {content.map((line, i) => {
              // Handle bullet points
              if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                return <p key={i} className="mb-1">{line}</p>;
              }
              // Handle numbered lists
              else if (/^\d+\./.test(line.trim())) {
                return <p key={i} className="mb-1">{line}</p>;
              }
              // Handle subheadings
              else if (line.endsWith(':')) {
                return <p key={i} className="font-medium mt-2 mb-1">{line}</p>;
              }
              // Regular text
              else if (line.trim()) {
                return <p key={i} className="mb-1">{line}</p>;
              }
              return null;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>AI Analysis</CardTitle>
          <CardDescription>
            Insights for the selected date range ({selectedReviews.length} reviews)
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshAnalysis} 
          disabled={isAnalysisLoading || selectedReviews.length === 0}
          className="ml-2"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isAnalysisLoading && "animate-spin")} />
          Refresh Analysis
        </Button>
      </CardHeader>
      <CardContent>
        {isAnalysisLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        ) : analysisError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
        ) : aiAnalysis ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-xs text-muted-foreground mb-2">
              Generated with {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} {aiModel}
            </div>
            {formatAnalysisForDisplay(aiAnalysis)}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {selectedReviews.length === 0 
              ? "No reviews available in the selected date range for analysis" 
              : "Click 'Refresh Analysis' to generate insights"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
