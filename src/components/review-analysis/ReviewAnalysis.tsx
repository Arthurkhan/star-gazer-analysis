
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  analyzeReviewSentiment_sync,
  extractStaffMentions_sync,
  extractCommonTerms_sync,
  analyzeReviewSentiment,
  extractStaffMentions,
  extractCommonTerms,
  getOverallAnalysis
} from "@/utils/dataUtils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2Icon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomPromptDialog } from "@/components/CustomPromptDialog";

// Import sub-components
import MonthlyReviewsChart from "./MonthlyReviewsChart";
import SentimentBreakdown from "./SentimentBreakdown";
import CommonTerms from "./CommonTerms";
import StaffMentions from "./StaffMentions";
import LanguageDistribution from "./LanguageDistribution";
import AnalysisAlertSection from "./AnalysisAlertSection";

interface ReviewAnalysisProps {
  reviews: Review[];
}

const ReviewAnalysis = ({ reviews }: ReviewAnalysisProps) => {
  // States for async data
  const [sentimentData, setSentimentData] = useState(analyzeReviewSentiment_sync(reviews));
  const [staffMentions, setStaffMentions] = useState(extractStaffMentions_sync(reviews));
  const [commonTerms, setCommonTerms] = useState(extractCommonTerms_sync(reviews));
  const [overallAnalysis, setOverallAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger refresh

  // Handle refresh AI analysis
  const handleRefreshAnalysis = () => {
    // Clear the cache to force a fresh analysis
    localStorage.removeItem("analysis_cache_key");
    setRefreshKey(prev => prev + 1); // Increment refresh key to trigger useEffect
  };

  // Display the current AI provider and model
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

  // Load AI analysis when reviews change or refresh is triggered
  useEffect(() => {
    let isMounted = true;
    
    // Reset loading state
    setLoading(true);
    setApiError(null);
    
    // Start with synchronous data for immediate UI display
    setSentimentData(analyzeReviewSentiment_sync(reviews));
    setStaffMentions(extractStaffMentions_sync(reviews));
    setCommonTerms(extractCommonTerms_sync(reviews));
    
    // Fetch AI-enhanced data
    const fetchAIAnalysis = async () => {
      try {
        // Clear cache to force a fresh analysis
        localStorage.removeItem("analysis_cache_key"); 
        
        // Run all analysis in parallel
        const [
          sentimentResults, 
          staffResults, 
          termsResults,
          analysisResult
        ] = await Promise.all([
          analyzeReviewSentiment(reviews),
          extractStaffMentions(reviews),
          extractCommonTerms(reviews),
          getOverallAnalysis(reviews)
        ]);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setSentimentData(sentimentResults);
          setStaffMentions(staffResults);
          setCommonTerms(termsResults);
          setOverallAnalysis(analysisResult);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching AI analysis:", error);
        if (isMounted) {
          setApiError(
            "Could not retrieve AI-enhanced analysis. Using basic analysis instead."
          );
          setLoading(false);
        }
      }
    };
    
    if (reviews.length > 0) {
      fetchAIAnalysis();
    } else {
      setLoading(false);
    }
    
    // Cleanup function to prevent setting state after unmount
    return () => {
      isMounted = false;
    };
  }, [reviews, refreshKey]); // Add refreshKey dependency to trigger on refresh

  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Review Analysis</CardTitle>
            <CardDescription>
              Breakdown of review sentiment, languages, and key terms
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshAnalysis}
              className="gap-1 text-xs"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh Analysis</span>
            </Button>
            <CustomPromptDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center p-4 mb-4">
            <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing reviews with {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} {aiModel}...</span>
          </div>
        )}
        
        <AnalysisAlertSection 
          overallAnalysis={overallAnalysis}
          loading={loading}
          error={apiError}
          aiProvider={aiProvider}
          aiModel={aiModel}
        />
        
        <div className="grid grid-cols-1 gap-6">
          {/* Monthly Reviews Line Graph */}
          <MonthlyReviewsChart reviews={reviews} />
          
          {/* Sentiment Breakdown */}
          <SentimentBreakdown reviews={reviews} loading={loading} />
          
          {/* Common Terms Section */}
          <CommonTerms reviews={reviews} loading={loading} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Staff Mentions Section */}
          <StaffMentions reviews={reviews} loading={loading} />
          
          {/* Review Languages Section */}
          <LanguageDistribution reviews={reviews} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalysis;
