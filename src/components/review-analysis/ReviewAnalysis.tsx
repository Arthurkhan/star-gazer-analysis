
import React, { useState } from "react";
import { Review } from "@/types/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAnalysis } from "@/utils/ai/analysisService";
import SentimentBreakdown from "./SentimentBreakdown";
import StaffMentions from "./StaffMentions";
import LanguageDistribution from "./LanguageDistribution";
import CommonTerms from "./CommonTerms";
import MonthlyReviewsChart from "./MonthlyReviewsChart";

interface ReviewAnalysisProps {
  reviews: Review[];
}

const ReviewAnalysis: React.FC<ReviewAnalysisProps> = ({ reviews }) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisTab, setAnalysisTab] = useState("sentiment");

  const refreshAnalysis = async () => {
    if (reviews.length === 0) {
      setError("No reviews available to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      await getAnalysis(reviews);
      toast({
        title: "Analysis Complete",
        description: "Review analysis has been updated",
      });
    } catch (err) {
      console.error("Error analyzing reviews:", err);
      setError("Failed to analyze reviews. Please try again later.");
      toast({
        title: "Analysis Error",
        description: "Failed to analyze reviews. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Review Analysis</CardTitle>
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
        <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="staff">Staff Mentioned</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
            <TabsTrigger value="terms">Common Terms</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="sentiment" className="space-y-0 mt-0">
            <SentimentBreakdown reviews={reviews} loading={isAnalyzing} />
          </TabsContent>

          <TabsContent value="staff" className="space-y-0 mt-0">
            <StaffMentions reviews={reviews} loading={isAnalyzing} />
          </TabsContent>

          <TabsContent value="language" className="space-y-0 mt-0">
            <LanguageDistribution reviews={reviews} />
          </TabsContent>

          <TabsContent value="terms" className="space-y-0 mt-0">
            <CommonTerms reviews={reviews} loading={isAnalyzing} />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-0 mt-0">
            <MonthlyReviewsChart reviews={reviews} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalysis;
