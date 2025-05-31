import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Star, TrendingUp, Users, Calendar, AlertCircle, ThumbsUp } from "lucide-react";
import { Review } from "@/types/reviews";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface BusinessComparisonProps {
  allReviews: Review[];
  businessData: {
    allBusinesses: { name: string; count: number };
    businesses: Record<string, any>;
  };
}

const BUSINESS_COLORS = {
  "The Little Prince Cafe": "#3B82F6", // Blue
  "Vol de Nuit, The Hidden Bar": "#10B981", // Green
  "L'Envol Art Space": "#F59E0B" // Amber
};

const BusinessComparison: React.FC<BusinessComparisonProps> = ({ allReviews, businessData }) => {
  // Extract business names
  const businessNames = Object.keys(businessData.businesses);

  // Calculate monthly review trends for each business - ALL DATA
  const monthlyComparison = useMemo(() => {
    const monthlyData = new Map<string, Record<string, number>>();
    
    // Initialize all months with 0 values
    allReviews.forEach(review => {
      const date = new Date(review.publishedAtDate || review.publishedatdate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {});
        businessNames.forEach(name => {
          monthlyData.get(monthKey)![name] = 0;
        });
      }
    });
    
    // Count reviews per business per month
    allReviews.forEach(review => {
      const businessName = review.title || review.businessName || review.businesses?.name;
      if (!businessName || !businessNames.includes(businessName)) return;
      
      const date = new Date(review.publishedAtDate || review.publishedatdate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      
      const monthData = monthlyData.get(monthKey)!;
      monthData[businessName] = (monthData[businessName] || 0) + 1;
    });
    
    // Convert to array and sort by date - NO SLICING
    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({
        month: format(new Date(month), 'MMM yyyy'),
        ...counts
      }));
  }, [allReviews, businessNames]);

  // Calculate cumulative reviews for each business - ALL DATA
  const cumulativeComparison = useMemo(() => {
    const cumulative: Record<string, number> = {};
    businessNames.forEach(name => { cumulative[name] = 0; });
    
    const sortedReviews = [...allReviews].sort((a, b) => 
      new Date(a.publishedAtDate || a.publishedatdate).getTime() - 
      new Date(b.publishedAtDate || b.publishedatdate).getTime()
    );
    
    const monthlyData = new Map<string, Record<string, number>>();
    
    sortedReviews.forEach(review => {
      const businessName = review.title || review.businessName || review.businesses?.name;
      if (!businessName || !businessNames.includes(businessName)) return;
      
      cumulative[businessName] = (cumulative[businessName] || 0) + 1;
      
      const date = new Date(review.publishedAtDate || review.publishedatdate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      
      monthlyData.set(monthKey, { ...cumulative });
    });
    
    // Convert to array and sort by date - NO SLICING
    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({
        month: format(new Date(month), 'MMM yyyy'),
        ...counts
      }));
  }, [allReviews, businessNames]);

  // Calculate average ratings per business
  const ratingsComparison = useMemo(() => {
    return businessNames.map(name => {
      const businessReviews = allReviews.filter(review => {
        const reviewBusiness = review.title || review.businessName || review.businesses?.name;
        return reviewBusiness === name;
      });
      
      const avgRating = businessReviews.length > 0
        ? businessReviews.reduce((sum, review) => sum + (review.stars || 0), 0) / businessReviews.length
        : 0;
      
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: businessReviews.filter(r => r.stars === rating).length
      }));
      
      return {
        name,
        avgRating: Number(avgRating.toFixed(2)),
        totalReviews: businessReviews.length,
        ratingDistribution
      };
    });
  }, [allReviews, businessNames]);

  // Calculate sentiment comparison
  const sentimentComparison = useMemo(() => {
    return businessNames.map(name => {
      const businessReviews = allReviews.filter(review => {
        const reviewBusiness = review.title || review.businessName || review.businesses?.name;
        return reviewBusiness === name;
      });
      
      const sentiments = businessReviews.reduce((acc, review) => {
        const sentiment = review.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const total = businessReviews.length || 1;
      
      return {
        name,
        positive: ((sentiments.positive || 0) / total * 100).toFixed(1),
        neutral: ((sentiments.neutral || 0) / total * 100).toFixed(1),
        negative: ((sentiments.negative || 0) / total * 100).toFixed(1)
      };
    });
  }, [allReviews, businessNames]);

  // Calculate growth rates
  const growthComparison = useMemo(() => {
    return businessNames.map(name => {
      const businessReviews = allReviews.filter(review => {
        const reviewBusiness = review.title || review.businessName || review.businesses?.name;
        return reviewBusiness === name;
      });
      
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      
      const lastMonthReviews = businessReviews.filter(r => {
        const date = new Date(r.publishedAtDate || r.publishedatdate);
        return date >= lastMonth && date < now;
      }).length;
      
      const previousMonthReviews = businessReviews.filter(r => {
        const date = new Date(r.publishedAtDate || r.publishedatdate);
        return date >= twoMonthsAgo && date < lastMonth;
      }).length;
      
      const growthRate = previousMonthReviews > 0 
        ? ((lastMonthReviews - previousMonthReviews) / previousMonthReviews * 100)
        : 0;
      
      return {
        name,
        lastMonth: lastMonthReviews,
        previousMonth: previousMonthReviews,
        growthRate: Number(growthRate.toFixed(1))
      };
    });
  }, [allReviews, businessNames]);

  // Market share based on review count
  const marketShare = useMemo(() => {
    const total = allReviews.length || 1;
    return businessNames.map(name => {
      const businessReviews = allReviews.filter(review => {
        const reviewBusiness = review.title || review.businessName || review.businesses?.name;
        return reviewBusiness === name;
      });
      
      return {
        name,
        value: Number((businessReviews.length / total * 100).toFixed(1))
      };
    });
  }, [allReviews, businessNames]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ratingsComparison.map((business) => (
          <Card key={business.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: BUSINESS_COLORS[business.name as keyof typeof BUSINESS_COLORS] }}
                />
                {business.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{business.avgRating}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {business.totalReviews} reviews
                </div>
              </div>
              {growthComparison.find(g => g.name === business.name)?.growthRate !== 0 && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <TrendingUp className={`h-4 w-4 ${
                    growthComparison.find(g => g.name === business.name)!.growthRate > 0 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`} />
                  <span className={
                    growthComparison.find(g => g.name === business.name)!.growthRate > 0 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }>
                    {growthComparison.find(g => g.name === business.name)!.growthRate}% growth
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Reviews Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Reviews Trend</CardTitle>
          <CardDescription>Number of reviews per month for each business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {businessNames.map(name => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={BUSINESS_COLORS[name as keyof typeof BUSINESS_COLORS]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Reviews Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Reviews Growth</CardTitle>
          <CardDescription>Total accumulated reviews over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {businessNames.map(name => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={BUSINESS_COLORS[name as keyof typeof BUSINESS_COLORS]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis Comparison</CardTitle>
            <CardDescription>Distribution of positive, neutral, and negative reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="positive" fill="#10B981" name="Positive" />
                  <Bar dataKey="neutral" fill="#6B7280" name="Neutral" />
                  <Bar dataKey="negative" fill="#EF4444" name="Negative" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Market Share */}
        <Card>
          <CardHeader>
            <CardTitle>Market Share by Review Count</CardTitle>
            <CardDescription>Percentage of total reviews per business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketShare}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {marketShare.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={BUSINESS_COLORS[entry.name as keyof typeof BUSINESS_COLORS]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Rate Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth Rate</CardTitle>
          <CardDescription>Month-over-month growth comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {growthComparison.map((business) => (
              <div key={business.name} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: BUSINESS_COLORS[business.name as keyof typeof BUSINESS_COLORS] }}
                  />
                  {business.name}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Month:</span>
                    <span className="font-medium">{business.lastMonth} reviews</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Month:</span>
                    <span className="font-medium">{business.previousMonth} reviews</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Growth Rate:</span>
                    <span className={`font-medium ${
                      business.growthRate > 0 ? 'text-green-500' : 
                      business.growthRate < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {business.growthRate > 0 ? '+' : ''}{business.growthRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution - COMPACT HORIZONTAL LAYOUT */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
          <CardDescription>Breakdown of star ratings for each business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ratingsComparison.map((business) => (
              <div key={business.name} className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: BUSINESS_COLORS[business.name as keyof typeof BUSINESS_COLORS] }}
                  />
                  {business.name}
                </h4>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = business.ratingDistribution.find(r => r.rating === rating)?.count || 0;
                  const percentage = business.totalReviews > 0 
                    ? (count / business.totalReviews * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm">{rating}</span>
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-14 text-right">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessComparison;
