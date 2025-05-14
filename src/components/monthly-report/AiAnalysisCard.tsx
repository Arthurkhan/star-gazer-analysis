
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
  // State for the additional analysis data
  const [ratingBreakdown, setRatingBreakdown] = useState<any[]>([]);
  const [languageDistribution, setLanguageDistribution] = useState<any[]>([]);

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
      
      const analysisData = await getOverallAnalysis(selectedReviews);
      
      // Check if we have a structured response with additional data
      if (analysisData && typeof analysisData === 'object' && 'overallAnalysis' in analysisData) {
        // Use optional chaining and nullish coalescing for safer property access
        setAiAnalysis(analysisData.overallAnalysis || "");
        setRatingBreakdown(analysisData.ratingBreakdown || []);
        setLanguageDistribution(analysisData.languageDistribution || []);
      } else if (analysisData) {
        // If we just got a string, set it as the analysis
        setAiAnalysis(typeof analysisData === 'string' ? analysisData : "");
        
        // Calculate rating breakdown manually
        calculateRatingBreakdown(selectedReviews);
        calculateLanguageDistribution(selectedReviews);
      } else {
        // If we got nothing valid, set an empty string and calculate stats manually
        setAiAnalysis("");
        calculateRatingBreakdown(selectedReviews);
        calculateLanguageDistribution(selectedReviews);
      }
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setAnalysisError("Could not retrieve AI analysis. Please try again later.");
      
      // Still calculate basic stats even if AI fails
      calculateRatingBreakdown(selectedReviews);
      calculateLanguageDistribution(selectedReviews);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Calculate rating breakdown as a fallback
  const calculateRatingBreakdown = (reviews: Review[]) => {
    const totalReviews = reviews.length;
    const counts = {
      1: reviews.filter(r => r.star === 1).length,
      2: reviews.filter(r => r.star === 2).length,
      3: reviews.filter(r => r.star === 3).length,
      4: reviews.filter(r => r.star === 4).length,
      5: reviews.filter(r => r.star === 5).length
    };
    
    setRatingBreakdown([
      { rating: 5, count: counts[5], percentage: totalReviews ? (counts[5] / totalReviews) * 100 : 0 },
      { rating: 4, count: counts[4], percentage: totalReviews ? (counts[4] / totalReviews) * 100 : 0 },
      { rating: 3, count: counts[3], percentage: totalReviews ? (counts[3] / totalReviews) * 100 : 0 },
      { rating: 2, count: counts[2], percentage: totalReviews ? (counts[2] / totalReviews) * 100 : 0 },
      { rating: 1, count: counts[1], percentage: totalReviews ? (counts[1] / totalReviews) * 100 : 0 }
    ]);
  };

  // Calculate language distribution as a fallback
  const calculateLanguageDistribution = (reviews: Review[]) => {
    const totalReviews = reviews.length;
    const languages: Record<string, number> = {};
    
    // Count occurrences of each language
    reviews.forEach(review => {
      const language = review.originalLanguage || "Unknown";
      languages[language] = (languages[language] || 0) + 1;
    });
    
    // Convert to array and calculate percentages
    const distribution = Object.entries(languages).map(([language, count]) => ({
      language,
      count,
      percentage: totalReviews ? (count / totalReviews) * 100 : 0
    })).sort((a, b) => b.count - a.count);
    
    setLanguageDistribution(distribution);
  };

  // Get the AI provider and model information
  const aiProvider = localStorage.getItem("AI_PROVIDER") || "openai";
  let aiModel = "";
  
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
      setRatingBreakdown([]);
      setLanguageDistribution([]);
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

  // Format rating breakdowns as a horizontal bar chart
  const renderRatingBreakdown = () => {
    if (!ratingBreakdown || ratingBreakdown.length === 0) return null;
    
    return (
      <div className="mt-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Rating Breakdown</h3>
        <div className="space-y-2">
          {ratingBreakdown.map((item) => (
            <div key={item.rating} className="flex items-center">
              <div className="w-16 flex items-center">
                <span className="text-sm font-medium">{item.rating}★</span>
              </div>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400" 
                  style={{ width: `${Math.max(item.percentage, 2)}%` }} 
                />
              </div>
              <div className="w-20 ml-2 text-sm">
                {item.count} ({Math.round(item.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format language distribution
  const renderLanguageDistribution = () => {
    if (!languageDistribution || languageDistribution.length === 0) return null;
    
    return (
      <div className="mt-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Language Distribution</h3>
        <div className="space-y-2">
          {languageDistribution.slice(0, 5).map((item) => (
            <div key={item.language} className="flex items-center">
              <div className="w-24 flex items-center">
                <span className="text-sm font-medium truncate">{item.language}</span>
              </div>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400" 
                  style={{ width: `${Math.max(item.percentage, 2)}%` }} 
                />
              </div>
              <div className="w-20 ml-2 text-sm">
                {item.count} ({Math.round(item.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
            
            {/* Show rating breakdown at the top */}
            {renderRatingBreakdown()}
            
            {/* Show language distribution */}
            {renderLanguageDistribution()}
            
            {/* Show overall analysis */}
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
