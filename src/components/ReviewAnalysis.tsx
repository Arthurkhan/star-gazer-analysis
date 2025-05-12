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
  PieChart,
  Pie,
  Cell,
  Sector,
  Treemap
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
import { InfoIcon, Loader2Icon, UserIcon, RefreshCw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomPromptDialog } from "./CustomPromptDialog";

interface ReviewAnalysisProps {
  reviews: Review[];
}

// Enhanced colors for pie chart with better contrast
const COLORS = [
  '#6E59A5', // Dark Purple
  '#9b87f5', // Primary Purple
  '#0EA5E9', // Ocean Blue
  '#10B981', // Green
  '#F97316', // Bright Orange
  '#D946EF', // Magenta Pink
  '#8B5CF6', // Vivid Purple
  '#0088FE', // Bright Blue
  '#33C3F0', // Sky Blue
  '#D3E4FD', // Soft Blue
  '#FFDEE2', // Soft Pink
  '#FEC6A1', // Soft Orange
  '#FEF7CD', // Soft Yellow
  '#F2FCE2'  // Soft Green
];

// Category-specific colors for consistent visualization
const CATEGORY_COLORS: Record<string, string> = {
  "Service": "#10B981", // Green
  "Ambiance": "#8B5CF6", // Purple
  "Food & Drinks": "#F97316", // Orange
  "Value & Price": "#0EA5E9", // Blue
  "Cleanliness": "#06B6D4", // Cyan
  "Location": "#F59E0B", // Amber
  "Art & Gallery": "#EC4899", // Pink
  "Little Prince Theme": "#6366F1", // Indigo
  "Overall Experience": "#0284C7", // Sky
  "Staff": "#4F46E5", // Indigo
  "Others": "#6B7280", // Gray
};

// Function to group languages with less than 1% into "Other"
const groupMinorLanguages = (languageData: { name: string; value: number }[], totalReviews: number) => {
  const threshold = totalReviews * 0.01; // 1% threshold
  
  const majorLanguages = languageData.filter(lang => lang.value >= threshold);
  const minorLanguages = languageData.filter(lang => lang.value < threshold);
  
  // Only create an "Other" category if there are minor languages
  if (minorLanguages.length > 0) {
    const otherValue = minorLanguages.reduce((sum, lang) => sum + lang.value, 0);
    
    // Create a list of minor language names for the tooltip
    const otherLanguageNames = minorLanguages.map(lang => `${lang.name} (${lang.value})`).join(', ');
    
    return [
      ...majorLanguages,
      { 
        name: 'Other', 
        value: otherValue,
        languages: minorLanguages,
        tooltip: otherLanguageNames
      }
    ];
  }
  
  return languageData;
};

// Custom active shape for pie chart with label - improved for readability and dark mode
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent, name, value } = props;
  const sin = Math.sin(-midAngle * Math.PI / 180);
  const cos = Math.cos(-midAngle * Math.PI / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text 
        x={ex + (cos >= 0 ? 1 : -1) * 12} 
        y={ey} 
        textAnchor={textAnchor} 
        fill="#333" 
        className="dark:fill-white font-medium"
        style={{ fontSize: '12px' }}
      >
        {name}
      </text>
      <text 
        x={ex + (cos >= 0 ? 1 : -1) * 12} 
        y={ey} 
        dy={18} 
        textAnchor={textAnchor} 
        fill="#666" 
        className="dark:fill-white"
        style={{ fontSize: '12px' }}
      >
        {`${value} (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

// Enhanced tooltip for the pie chart with improved dark mode text
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
        <p className="text-gray-800 dark:text-gray-200">{`Reviews: ${data.value}`}</p>
        <p className="text-gray-800 dark:text-gray-200">{`Percentage: ${(data.value / data._total * 100).toFixed(1)}%`}</p>
        {data.name === 'Other' && data.tooltip && (
          <div className="mt-2 border-t pt-2 border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-xs text-gray-900 dark:text-white">Includes:</p>
            <p className="text-xs text-gray-800 dark:text-gray-200">{data.tooltip}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Treemap tooltip for common terms
const CustomTermsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white">{data.category || 'Uncategorized'}</p>
        <p className="text-gray-900 dark:text-white font-medium">{data.name}</p>
        <p className="text-gray-600 dark:text-gray-300">Mentioned in {data.value} reviews</p>
      </div>
    );
  }
  return null;
};

const ReviewAnalysis = ({ reviews }: ReviewAnalysisProps) => {
  // States for async data
  const [sentimentData, setSentimentData] = useState(analyzeReviewSentiment_sync(reviews));
  const [staffMentions, setStaffMentions] = useState(extractStaffMentions_sync(reviews));
  const [commonTerms, setCommonTerms] = useState(extractCommonTerms_sync(reviews));
  const [overallAnalysis, setOverallAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger refresh
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // State for pie chart active segment
  const [activePieIndex, setActivePieIndex] = useState(0);
  
  // Monthly review data (synchronous)
  const monthlyReviews = groupReviewsByMonth(reviews);
  
  // Find the maximum cumulative count for Y-axis scaling
  const maxCumulativeCount = monthlyReviews.length > 0 
    ? Math.max(...monthlyReviews.map(item => item.cumulativeCount || 0)) + 10
    : 10;
  
  // Language distribution with grouping for small percentages
  const totalReviews = reviews.length;
  const rawLanguageData = countReviewsByLanguage(reviews);
  const languageData = groupMinorLanguages(rawLanguageData, totalReviews);
  
  // Add total count to each language data item for percentage calculation in tooltip
  const languageDataWithTotal = languageData.map(item => ({
    ...item,
    _total: totalReviews
  }));
  
  // Colors for sentiment categories
  const SENTIMENT_COLORS = {
    "Positive": "#10B981", 
    "Neutral": "#6B7280", 
    "Negative": "#EF4444"
  };

  // Group common terms by category
  const getGroupedTerms = () => {
    // Extract unique categories
    const categories = Array.from(new Set(commonTerms.map(term => term.category || 'Others')));
    
    // Create category buckets
    const groupedByCategory: Record<string, {text: string, count: number, category?: string}[]> = {};
    
    categories.forEach(category => {
      groupedByCategory[category] = commonTerms.filter(term => (term.category || 'Others') === category);
    });
    
    return { categories, groupedByCategory };
  };
  
  const { categories, groupedByCategory } = getGroupedTerms();
  
  // Prepare data for treemap visualization
  const prepareTreemapData = () => {
    // Group by category first
    const categoryCounts: Record<string, number> = {};
    const categoryItems: Record<string, any[]> = {};
    
    commonTerms.forEach(term => {
      const category = term.category || 'Others';
      
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
        categoryItems[category] = [];
      }
      
      categoryCounts[category] += term.count;
      
      // Only add top terms per category to avoid overcrowding
      if (categoryItems[category].length < 8) {
        categoryItems[category].push({
          name: term.text,
          value: term.count,
          category: category,
          color: CATEGORY_COLORS[category] || COLORS[Object.keys(categoryItems).length % COLORS.length]
        });
      }
    });
    
    // Filter to only show categories with substantial mentions
    const significantCategories = Object.keys(categoryCounts)
      .filter(category => {
        // Show selected category or categories with >5% of total mentions
        const totalMentions = commonTerms.reduce((sum, term) => sum + term.count, 0);
        return selectedCategory === category || categoryCounts[category] / totalMentions > 0.05;
      });
    
    // Flatten the items from significant categories
    const treemapData = significantCategories.flatMap(category => categoryItems[category]);
    
    return treemapData.sort((a, b) => b.value - a.value);
  };
  
  const treemapData = prepareTreemapData();

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
            <AlertTitle>AI Analysis ({aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} {aiModel})</AlertTitle>
            <AlertDescription className="whitespace-pre-line prose prose-sm max-w-none">
              {overallAnalysis}
            </AlertDescription>
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
          
          {/* Sentiment Breakdown - Enhanced visualization */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Sentiment Breakdown {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {sentimentData.map((entry) => {
                const percentage = ((entry.value / totalReviews) * 100).toFixed(1);
                return (
                  <div 
                    key={entry.name} 
                    className="flex flex-col items-center p-4 rounded-lg border dark:border-gray-700 transition-all duration-300 hover:shadow-md"
                    style={{ 
                      borderLeft: `4px solid ${SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]}`,
                      backgroundColor: `${SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]}10` 
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-sm mb-2" 
                      style={{ backgroundColor: SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] }}
                    />
                    <div className="font-medium text-lg">{entry.name}</div>
                    <div className="text-2xl font-bold">{entry.value}</div>
                    <div className="text-gray-500 dark:text-gray-400">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Common Terms - Enhanced with Categories and Visual Grouping */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Common Terms & Themes {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
            </h3>
            
            <Tabs defaultValue="treemap" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="treemap">Visual Map</TabsTrigger>
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              {/* Treemap visualization */}
              <TabsContent value="treemap" className="mt-0">
                <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border mb-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button 
                      variant={selectedCategory === null ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All
                    </Button>
                    
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                        className="text-xs"
                        style={{ 
                          borderColor: CATEGORY_COLORS[category] || undefined,
                          color: selectedCategory === category ? undefined : CATEGORY_COLORS[category] || undefined
                        }}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={treemapData}
                        dataKey="value"
                        aspectRatio={4/3}
                        stroke="#fff"
                        fill="#8884d8"
                        nameKey="name"
                      >
                        <Tooltip content={<CustomTermsTooltip />} />
                        {treemapData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
              
              {/* Categories view */}
              <TabsContent value="categories" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map(category => (
                    <div 
                      key={category}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm"
                    >
                      <h4 className="font-medium text-base mb-3 pb-2 border-b dark:border-gray-700 flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: CATEGORY_COLORS[category] || COLORS[categories.indexOf(category) % COLORS.length] }}
                        />
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {groupedByCategory[category]
                          .slice(0, 6)
                          .map((term, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm">{term.text}</span>
                              <Badge variant="outline" className="text-xs">
                                {term.count}
                              </Badge>
                            </div>
                          )
                        )}
                        
                        {groupedByCategory[category].length > 6 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
                            + {groupedByCategory[category].length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              {/* Table view */}
              <TabsContent value="table" className="mt-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Occurrences</TableHead>
                        <TableHead>% of Reviews</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commonTerms.slice(0, 20).map((term, index) => {
                        const percentage = (term.count / reviews.length * 100).toFixed(1);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{term.text}</TableCell>
                            <TableCell>
                              {term.category && (
                                <Badge 
                                  variant="outline" 
                                  style={{ 
                                    borderColor: CATEGORY_COLORS[term.category] || undefined,
                                    color: CATEGORY_COLORS[term.category] || undefined
                                  }}
                                >
                                  {term.category}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{term.count}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Enhanced Staff Mentions Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Staff Mentioned {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
            </h3>
            
            {staffMentions.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/20 rounded-lg border">
                <UserIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">No Staff Identified</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Our AI couldn't identify specific staff mentioned by name in the reviews.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {staffMentions.map((staff, index) => (
                  <AccordionItem key={index} value={`staff-${index}`}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 dark:text-white">{staff.name}</span>
                          <Badge className={`ml-2 ${
                            staff.sentiment === "positive" 
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300" 
                              : staff.sentiment === "negative"
                              ? "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                          }`}>
                            {staff.sentiment}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {staff.count} mention{staff.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-1 pt-2 pb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Review Quotes:
                        </h4>
                        <ul className="space-y-2">
                          {staff.examples && staff.examples.map((example, idx) => (
                            <li key={idx} className="text-sm border-l-2 pl-3 py-1 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                              "{example}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          
          {/* Review Languages - Enhanced Pie Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Review Languages
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activePieIndex}
                    activeShape={renderActiveShape}
                    data={languageDataWithTotal}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    className="dark:fill-white"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {languageDataWithTotal.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {languageDataWithTotal.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {languageDataWithTotal.slice(0, 5).map((entry, index) => (
                  <div 
                    key={`legend-${index}`} 
                    className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-white"
                  >
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{entry.name}</span>
                  </div>
                ))}
                {languageDataWithTotal.length > 5 && (
                  <div className="text-xs text-gray-700 dark:text-white">
                    + {languageDataWithTotal.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalysis;
