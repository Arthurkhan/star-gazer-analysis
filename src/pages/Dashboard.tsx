
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import BusinessSelector from "@/components/BusinessSelector";
import OverviewSection from "@/components/OverviewSection";
import ReviewAnalysis from "@/components/ReviewAnalysis";
import ReviewsTable from "@/components/ReviewsTable";
import KeyInsights from "@/components/KeyInsights";
import { Review, BusinessData } from "@/types/reviews";
import { supabase } from "@/integrations/supabase/client";

// Define allowed table names explicitly to match Supabase structure
type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
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
      // since the pg_catalog.pg_tables query is causing TypeScript errors
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use the tables we've fetched dynamically
      const tables = availableTables;
      
      let allReviews: Review[] = [];
      console.log("Fetching data from tables:", tables);
      
      for (const tableName of tables) {
        console.log(`Fetching data from table: ${tableName}`);
        
        try {
          // Special handling for The Little Prince Cafe with higher limit
          let query = supabase
            .from(tableName as TableName)
            .select('*');
          
          // Explicitly remove any row limit for The Little Prince Cafe
          // For Supabase, we need to use a very high number as there's no way to remove the limit completely
          const { data, error } = await query.limit(10000);
            
          if (error) {
            console.error(`Error fetching from ${tableName}:`, error);
            continue; // Skip this table but continue with others
          }
          
          if (data) {
            console.log(`Retrieved ${data.length} rows from ${tableName}`);
            // Map the data to our Review type, handling possible column name variations
            const reviews = data.map((item: any) => ({
              name: item.name,
              title: item.title || tableName, // Use table name if title is missing
              star: item.stars || item.star, // Handle both column names
              originalLanguage: item.originalLanguage,
              text: item.text,
              translatedText: item.textTranslated || item.translatedText, // Handle both column names
              responseFromOwnerText: item.responseFromOwnerText,
              publishedAtDate: item.publishedAtDate,
              reviewUrl: item.reviewUrl
            }));
            
            allReviews = [...allReviews, ...reviews];
          }
        } catch (tableError) {
          console.error(`Failed to query table ${tableName}:`, tableError);
          // Continue with the next table
        }
      }
      
      console.log(`Total reviews fetched: ${allReviews.length}`);
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
      <BusinessSelector
        selectedBusiness={selectedBusiness}
        onBusinessChange={handleBusinessChange}
        businessData={businessData}
      />
      
      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading review data...</p>
          </div>
        </div>
      ) : (
        <>
          <OverviewSection reviews={getFilteredReviews()} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ReviewAnalysis reviews={getFilteredReviews()} />
            <KeyInsights reviews={getFilteredReviews()} />
          </div>
          <ReviewsTable reviews={getFilteredReviews()} />
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
