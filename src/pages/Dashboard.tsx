
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

// Define valid table names type to match Supabase schema
type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<string>(
    localStorage.getItem("selectedBusiness") || "all"
  );
  const [reviewData, setReviewData] = useState<Review[]>([]);
  const [businessData, setBusinessData] = useState<BusinessData>({
    allBusinesses: { name: "All Businesses", count: 0 },
    businesses: {
      "L'Envol Art Space": { name: "L'Envol Art Space", count: 0 },
      "The Little Prince Cafe": { name: "The Little Prince Cafe", count: 0 },
      "Vol de Nuit, The Hidden Bar": { name: "Vol de Nuit, The Hidden Bar", count: 0 },
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Save selected business to localStorage
    localStorage.setItem("selectedBusiness", selectedBusiness);
    
    // Filter data based on selected business
    if (selectedBusiness !== "all") {
      const filteredData = reviewData.filter(
        (review) => review.title === selectedBusiness
      );
      setBusinessData((prev) => ({
        ...prev,
        allBusinesses: { ...prev.allBusinesses, count: reviewData.length },
        businesses: {
          ...prev.businesses,
          [selectedBusiness]: {
            ...prev.businesses[selectedBusiness],
            count: filteredData.length,
          },
        },
      }));
    } else {
      setBusinessData((prev) => ({
        ...prev,
        allBusinesses: { ...prev.allBusinesses, count: reviewData.length },
      }));
    }
  }, [selectedBusiness, reviewData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Define the tables to fetch from
      const tables: TableName[] = [
        "L'Envol Art Space",
        "The Little Prince Cafe",
        "Vol de Nuit, The Hidden Bar"
      ];
      
      let allReviews: Review[] = [];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          // Map the data to our Review type
          const reviews = data.map((item: any) => ({
            name: item.name,
            title: item.title || table, // Use table name if title is missing
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
      }
      
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
      
      setBusinessData({
        allBusinesses: { name: "All Businesses", count: allReviews.length },
        businesses: {
          "L'Envol Art Space": { 
            name: "L'Envol Art Space", 
            count: businessCounts["L'Envol Art Space"] || 0 
          },
          "The Little Prince Cafe": { 
            name: "The Little Prince Cafe", 
            count: businessCounts["The Little Prince Cafe"] || 0 
          },
          "Vol de Nuit, The Hidden Bar": { 
            name: "Vol de Nuit, The Hidden Bar", 
            count: businessCounts["Vol de Nuit, The Hidden Bar"] || 0 
          },
        },
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
