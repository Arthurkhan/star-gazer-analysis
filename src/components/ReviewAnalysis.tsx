
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Review } from "@/types/reviews";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts";
import { 
  analyzeReviewSentiment, 
  countReviewsByLanguage, 
  extractStaffMentions 
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

interface ReviewAnalysisProps {
  reviews: Review[];
}

const ReviewAnalysis = ({ reviews }: ReviewAnalysisProps) => {
  // Analyze sentiment
  const sentimentData = analyzeReviewSentiment(reviews);
  
  // Language distribution
  const languageData = countReviewsByLanguage(reviews);
  
  // Mock word cloud data - most frequent words with counts
  const commonTerms = [
    { text: "service", count: Math.floor(Math.random() * 15) + 15 },
    { text: "food", count: Math.floor(Math.random() * 15) + 10 },
    { text: "atmosphere", count: Math.floor(Math.random() * 10) + 10 },
    { text: "staff", count: Math.floor(Math.random() * 10) + 8 },
    { text: "price", count: Math.floor(Math.random() * 8) + 5 },
    { text: "quality", count: Math.floor(Math.random() * 8) + 5 },
    { text: "experience", count: Math.floor(Math.random() * 7) + 5 },
    { text: "recommend", count: Math.floor(Math.random() * 6) + 4 },
    { text: "ambiance", count: Math.floor(Math.random() * 6) + 3 },
    { text: "excellent", count: Math.floor(Math.random() * 5) + 3 },
  ].sort((a, b) => b.count - a.count);
  
  // Staff mentions
  const staffMentions = extractStaffMentions(reviews);
  
  // Colors for sentiment pie chart
  const SENTIMENT_COLORS = {
    "Positive": "#10B981", 
    "Neutral": "#6B7280", 
    "Negative": "#EF4444"
  };
  
  // Total reviews count for percentage calculations
  const totalReviews = reviews.length;

  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle>Review Analysis</CardTitle>
        <CardDescription>
          Breakdown of review sentiment, languages, and key terms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment Breakdown - Enhanced visualization */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Sentiment Breakdown
            </h3>
            <div className="h-64 flex flex-col md:flex-row items-center justify-between">
              <div className="w-full md:w-2/3 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sentimentData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      scale="band" 
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        return [`${value} reviews (${((Number(value) / totalReviews) * 100).toFixed(1)}%)`, props.payload.name];
                      }}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "6px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Reviews"
                      radius={[0, 4, 4, 0]}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || "#8884d8"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-row md:flex-col justify-center md:w-1/3 mt-4 md:mt-0 gap-3">
                {sentimentData.map((entry) => {
                  const percentage = ((entry.value / totalReviews) * 100).toFixed(1);
                  return (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-sm" 
                        style={{ backgroundColor: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] }}
                      />
                      <div className="text-sm">
                        <span className="font-medium">{entry.name}:</span> {entry.value} 
                        <span className="text-gray-500 ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Language Distribution */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Review Languages
            </h3>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languageData.map((item, index) => {
                    const percentage = (item.value / reviews.length * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Common Terms Table */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Common Terms
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
          
          {/* Staff Mentions */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Staff Mentioned
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
                  {staffMentions.map((staff, index) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalysis;
