
import React, { useState, useEffect } from "react";
import { Review } from "@/types/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAnalysis } from "@/utils/ai/analysisService";
import AnalysisAlertSection from "./review-analysis/AnalysisAlertSection";
import { Skeleton } from "@/components/ui/skeleton";

interface AllReviewsAiAnalysisProps {
  reviews: Review[];
}

const AllReviewsAiAnalysis: React.FC<AllReviewsAiAnalysisProps> = ({ reviews }) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overallAnalysis, setOverallAnalysis] = useState<string>("");
  const [aiProvider, setAiProvider] = useState<string>("gemini");
  const [aiModel, setAiModel] = useState<string>("pro");
  const [previousReviewCount, setPreviousReviewCount] = useState(0);

  // Fetch analysis when reviews change
  useEffect(() => {
    if (
      (reviews.length > 0 && Math.abs(reviews.length - previousReviewCount) > 5) || 
      (reviews.length > 0 && !overallAnalysis && !isAnalyzing)
    ) {
      setPreviousReviewCount(reviews.length);
      refreshAnalysis();
    } else if (reviews.length === 0) {
      setOverallAnalysis("");
      setPreviousReviewCount(0);
    }
  }, [reviews.length]);

  const refreshAnalysis = async () => {
    if (reviews.length === 0) {
      setError("No reviews available to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResponse = await getAnalysis(reviews);
      
      if (analysisResponse.error) {
        setError(analysisResponse.error);
        toast({
          title: "Analysis Error",
          description: analysisResponse.error,
          variant: "destructive",
        });
      } else {
        setOverallAnalysis(analysisResponse.overallAnalysis || "");
        setAiProvider(analysisResponse.provider || "gemini");
        setAiModel(analysisResponse.model || "pro");
        
        toast({
          title: "Analysis Complete",
          description: "Review analysis has been updated",
        });
      }
    } catch (err) {
      console.error("Error analyzing reviews:", err);
      setError("Failed to analyze reviews. Please try again later.");
      toast({
        title: "Analysis Error",
        description: "Failed to analyze reviews. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Function to format analysis for display
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">AI Summary Analysis</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAnalysis}
          disabled={isAnalyzing || reviews.length === 0}
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`}
          />
          {isAnalyzing ? "Analyzing..." : "Refresh Analysis"}
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {isAnalyzing ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        ) : (
          <AnalysisAlertSection 
            overallAnalysis={overallAnalysis} 
            loading={isAnalyzing} 
            error={error}
            aiProvider={aiProvider}
            aiModel={aiModel}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AllReviewsAiAnalysis;
