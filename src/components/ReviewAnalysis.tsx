
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from "recharts";
import { analyzeReviewSentiment, countReviewsByLanguage } from "@/utils/dataUtils";

interface ReviewAnalysisProps {
  reviews: Review[];
}

const ReviewAnalysis = ({ reviews }: ReviewAnalysisProps) => {
  // Analyze sentiment
  const sentimentData = analyzeReviewSentiment(reviews);
  
  // Language distribution
  const languageData = countReviewsByLanguage(reviews);
  
  // Calculate average response time (in days)
  // This is a simplified version
  let totalResponseTime = 0;
  let responsesWithTime = 0;
  
  reviews.forEach(review => {
    if (review.responseFromOwnerText && review.publishedAtDate) {
      // Assume response comes 3-5 days after review for mock data
      // In real app, we'd need actual response dates
      totalResponseTime += Math.floor(Math.random() * 3) + 3;
      responsesWithTime++;
    }
  });
  
  const avgResponseTime = responsesWithTime > 0 
    ? (totalResponseTime / responsesWithTime).toFixed(1) 
    : "N/A";
  
  // Mock word cloud data - most frequent words
  const wordCloudTerms = [
    { text: "service", value: Math.floor(Math.random() * 15) + 15 },
    { text: "food", value: Math.floor(Math.random() * 15) + 10 },
    { text: "atmosphere", value: Math.floor(Math.random() * 10) + 10 },
    { text: "staff", value: Math.floor(Math.random() * 10) + 8 },
    { text: "price", value: Math.floor(Math.random() * 8) + 5 },
    { text: "quality", value: Math.floor(Math.random() * 8) + 5 },
    { text: "experience", value: Math.floor(Math.random() * 7) + 5 },
    { text: "recommend", value: Math.floor(Math.random() * 6) + 4 },
    { text: "ambiance", value: Math.floor(Math.random() * 6) + 3 },
    { text: "excellent", value: Math.floor(Math.random() * 5) + 3 },
  ];
  
  // Colors for sentiment pie chart
  const SENTIMENT_COLORS = ["#10B981", "#6B7280", "#EF4444"];
  
  // Colors for language pie chart (randomly generated)
  const LANGUAGE_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", 
    "#10B981", "#84cc16", "#eab308", "#14b8a6"
  ];

  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle>Review Analysis</CardTitle>
        <CardDescription>
          Breakdown of review sentiment, languages, and response times
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment Breakdown */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Sentiment Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} reviews`, "Count"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Language Distribution */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Review Languages
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {languageData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} reviews`, "Count"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Simple Word Cloud */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Common Terms
            </h3>
            <div className="flex flex-wrap gap-2">
              {wordCloudTerms.map((term, index) => (
                <div 
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                  style={{ 
                    fontSize: `${Math.max(term.value / 3, 0.8)}rem`, 
                    opacity: term.value / 20 + 0.5 
                  }}
                >
                  {term.text}
                </div>
              ))}
            </div>
          </div>
          
          {/* Response Time */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Average Response Time
            </h3>
            <div className="flex items-center justify-center h-24">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {avgResponseTime} 
                <span className="text-xl ml-1 text-gray-600 dark:text-gray-400">days</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalysis;
