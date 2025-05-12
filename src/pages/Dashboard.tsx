
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import OverviewSection from "@/components/OverviewSection";
import ReviewAnalysis from "@/components/ReviewAnalysis";
import ReviewsTable from "@/components/ReviewsTable";
import KeyInsights from "@/components/KeyInsights";
import MonthlyReport from "@/components/MonthlyReport";
import { ApiKeyStatus } from "@/components/ApiKeyStatus";
import { TableAnalysisPanel } from "@/components/TableAnalysisPanel";
import { Review, BusinessData, TableName } from "@/types/reviews";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-reviews");
  const [availableTables, setAvailableTables] = useState<TableName[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>(
    localStorage.getItem("selectedBusiness") || "all"
  );
  const [reviewData, setReviewData] = useState<Review[]>([]);
  const [businessData, setBusinessData] = useState<BusinessData>({
    allBusinesses: { name: "All Businesses", count: 0 },
    businesses: {},
  });

  // Fetch available tables first
  useEffect(() => {
    fetchAvailableTables();
  }, []);

  // Then fetch data once we have tables
  useEffect(() => {
    if (availableTables.length > 0) {
      fetchData();
    }
  }, [availableTables]);

  useEffect(() => {
    // Save selected business to localStorage
    localStorage.setItem("selectedBusiness", selectedBusiness);
    
    // Filter data based on selected business
    if (selectedBusiness !== "all") {
      const filteredData = reviewData.filter(
        (review) => review.title === selectedBusiness
      );
      
      setBusinessData((prev) => {
        const businesses = { ...prev.businesses };
        
        if (businesses[selectedBusiness]) {
          businesses[selectedBusiness] = {
            ...businesses[selectedBusiness],
            count: filteredData.length,
          };
        }
        
        return {
          ...prev,
          allBusinesses: { ...prev.allBusinesses, count: reviewData.length },
          businesses,
        };
      });
    } else {
      setBusinessData((prev) => ({
        ...prev,
        allBusinesses: { ...prev.allBusinesses, count: reviewData.length },
      }));
    }
  }, [selectedBusiness, reviewData]);

  const fetchAvailableTables = async () => {
    try {
      // We'll use the predefined tables instead of querying for them
      const knownTables: TableName[] = [
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      
      console.log("Using known tables:", knownTables);
      setAvailableTables(knownTables);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      toast({
        title: "Error fetching tables",
        description: "Could not retrieve the list of tables from Supabase.",
        variant: "destructive",
      });
      
      // Fallback to the tables we know exist
      const knownTables: TableName[] = [
        "L'Envol Art Space",
        "The Little Prince Cafe", 
        "Vol de Nuit, The Hidden Bar"
      ];
      setAvailableTables(knownTables);
    }
  };

  // Function to fetch data from a table with pagination
  const fetchTableDataWithPagination = async (tableName: TableName) => {
    console.log(`Fetching data from table: ${tableName} with pagination`);
    
    let allData: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000; // Supabase default limit
    
    while (hasMore) {
      try {
        // Calculate the range start based on the current page
        const rangeStart = page * pageSize;
        const rangeEnd = rangeStart + pageSize - 1;
        
        console.log(`Fetching page ${page+1} (rows ${rangeStart}-${rangeEnd}) from ${tableName}`);
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .range(rangeStart, rangeEnd);
        
        if (error) {
          console.error(`Error fetching page ${page+1} from ${tableName}:`, error);
          break;
        }
        
        if (data && data.length > 0) {
          console.log(`Retrieved ${data.length} rows from ${tableName}, page ${page+1}`);
          allData = [...allData, ...data];
          
          // Check if we've received fewer rows than the page size, indicating we're done
          hasMore = data.length === pageSize;
          
          // If count is available, we can be more precise
          if (count !== null) {
            hasMore = allData.length < count;
          }
        } else {
          // No more data
          hasMore = false;
        }
        
        page++;
      } catch (tableError) {
        console.error(`Failed to query table ${tableName} at page ${page+1}:`, tableError);
        break;
      }
    }
    
    console.log(`Total rows fetched from ${tableName}: ${allData.length}`);
    return allData;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use the tables we've fetched dynamically
      const tables = availableTables;
      
      let allReviews: Review[] = [];
      console.log("Fetching data from tables:", tables);
      
      for (const tableName of tables) {
        console.log(`Starting data fetch from table: ${tableName}`);
        
        try {
          // Use the pagination function to fetch all data
          const tableData = await fetchTableDataWithPagination(tableName);
          
          if (tableData && tableData.length > 0) {
            // Map the data to our Review type, handling possible column name variations
            const reviews = tableData.map((item: any) => ({
              name: item.name,
              title: item.title || tableName, // Use table name if title is missing
              star: item.stars || item.star, // Handle both column names
              originalLanguage: item.originalLanguage,
              text: item.text,
              textTranslated: item.textTranslated, // Match the property name in our type
              responseFromOwnerText: item.responseFromOwnerText,
              publishedAtDate: item.publishedAtDate,
              reviewUrl: item.reviewUrl,
              sentiment: item.sentiment,
              staffMentioned: item.staffMentioned,
              mainThemes: item.mainThemes,
              "common terms": item["common terms"]
            }));
            
            allReviews = [...allReviews, ...reviews];
          }
        } catch (tableError) {
          console.error(`Failed to query table ${tableName}:`, tableError);
          // Continue with the next table
        }
      }
      
      console.log(`Total reviews fetched across all tables: ${allReviews.length}`);
      setReviewData(allReviews);
      
      // Count reviews for each business
      const businessCounts = allReviews.reduce((acc, review) => {
        const business = review.title;
        if (!acc[business]) {
          acc[business] = 0;
        }
        acc[business]++;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("Business counts:", businessCounts);
      
      // Build a dynamic businessData object based on what we actually found
      const businessesObj: Record<string, { name: string; count: number }> = {};
      
      Object.keys(businessCounts).forEach(business => {
        businessesObj[business] = {
          name: business,
          count: businessCounts[business] || 0
        };
      });
      
      setBusinessData({
        allBusinesses: { name: "All Businesses", count: allReviews.length },
        businesses: businessesObj,
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "Could not fetch review data from the database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessChange = (business: string) => {
    setSelectedBusiness(business);
  };

  const getFilteredReviews = () => {
    if (selectedBusiness === "all") {
      return reviewData;
    }
    return reviewData.filter((review) => review.title === selectedBusiness);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-full">
        <BusinessSelector
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          businessData={businessData}
        />
      </div>
      
      {/* Add API Key Status Alert */}
      <ApiKeyStatus />
      
      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading review data...</p>
          </div>
        </div>
      ) : (
        <Tabs 
          defaultValue="all-reviews" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="monthly-report">Monthly Report</TabsTrigger>
            <TabsTrigger value="table-analysis">Table Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-reviews" className="mt-0">
            <OverviewSection reviews={getFilteredReviews()} />
            <div className="grid grid-cols-1 gap-6 mb-6">
              <ReviewAnalysis reviews={getFilteredReviews()} />
              <KeyInsights reviews={getFilteredReviews()} />
            </div>
            <ReviewsTable reviews={getFilteredReviews()} />
          </TabsContent>
          
          <TabsContent value="monthly-report" className="mt-0">
            <MonthlyReport reviews={getFilteredReviews()} />
          </TabsContent>
          
          <TabsContent value="table-analysis" className="mt-0">
            <TableAnalysisPanel />
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
