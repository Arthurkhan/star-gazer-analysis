
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer, 
  Legend, 
  Tooltip,
} from "recharts";
import { 
  analyzeReviewSentiment_sync,
  countReviewsByLanguage, 
  extractStaffMentions_sync,
  extractCommonTerms_sync,
  groupReviewsByMonth,
  analyzeReviewSentiment,
  extractStaffMentions,
  extractCommonTerms,
  getOverallAnalysis
} from "@/utils/dataUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2Icon } from "lucide-react";

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
  
  // Monthly review data (synchronous)
  const monthlyReviews = groupReviewsByMonth(reviews);
  
  // Find the maximum cumulative count for Y-axis scaling
  const maxCumulativeCount = monthlyReviews.length > 0 
    ? Math.max(...monthlyReviews.map(item => item.cumulativeCount || 0)) + 10
    : 10;
  
  // Language distribution (synchronous)
  const languageData = countReviewsByLanguage(reviews);
  
  // Colors for sentiment categories
  const SENTIMENT_COLORS = {
    "Positive": "#10B981", 
    "Neutral": "#6B7280", 
    "Negative": "#EF4444"
  };
  
  // Total reviews count for percentage calculations
  const totalReviews = reviews.length;

  // Load AI analysis when reviews change
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
  }, [reviews]);

  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle>Review Analysis</CardTitle>
        <CardDescription>
          Breakdown of review sentiment, languages, and key terms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center p-4 mb-4">
            <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing reviews with AI...</span>
          </div>
        )}
        
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Analysis Incomplete</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
        
        {overallAnalysis && (
          <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>AI Analysis</AlertTitle>
            <AlertDescription>{overallAnalysis}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {/* Monthly Reviews Line Graph */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Cumulative Reviews by Month
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyReviews}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis 
                    allowDecimals={false} 
                    domain={[0, maxCumulativeCount]}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} total reviews`, "Total Reviews"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeCount" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                    name="Cumulative"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Sentiment Breakdown - Text only, no graphic */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Sentiment Breakdown {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {sentimentData.map((entry) => {
                const percentage = ((entry.value / totalReviews) * 100).toFixed(1);
                return (
                  <div key={entry.name} className="flex flex-col items-center p-4 rounded-lg border">
                    <div 
                      className="w-4 h-4 rounded-sm mb-2" 
                      style={{ backgroundColor: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] }}
                    />
                    <div className="font-medium text-lg">{entry.name}</div>
                    <div className="text-xl font-bold">{entry.value}</div>
                    <div className="text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Common Terms Table */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Common Terms {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
            </h3>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Occurrences</TableHead>
                    <TableHead>% of Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commonTerms.map((term, index) => {
                    const percentage = (term.count / reviews.length * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium capitalize">{term.text}</TableCell>
                        <TableCell>{term.count}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Staff Mentions - Compact */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                Staff Mentioned {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
              </h3>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mentions</TableHead>
                      <TableHead>Sentiment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMentions.length > 0 ? (
                      staffMentions.map((staff, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell>{staff.count}</TableCell>
                          <TableCell>
                            <Badge className={
                              staff.sentiment === "positive" 
                                ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                : staff.sentiment === "negative"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }>
                              {staff.sentiment}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                          No staff mentions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Review Languages - More Compact */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Review Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {languageData.map((item, index) => {
                  const percentage = (item.value / reviews.length * 100).toFixed(1);
                  return (
                    <Badge key={index} variant="outline" className="px-2 py-1">
                      {item.name}: {item.value} ({percentage}%)
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalysis;
