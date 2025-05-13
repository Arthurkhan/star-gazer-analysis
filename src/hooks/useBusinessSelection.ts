
import { useState, useEffect } from "react";
import { BusinessData } from "@/types/reviews";

export function useBusinessSelection(reviewData: any[]) {
  const [selectedBusiness, setSelectedBusiness] = useState<string>(
    localStorage.getItem("selectedBusiness") || "all"
  );
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    allBusinesses: { name: "All Businesses", count: 0 },
    businesses: {},
  });

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

  // Handle business selection change
  const handleBusinessChange = (business: string) => {
    setSelectedBusiness(business);
  };

  return {
    selectedBusiness,
    businessData,
    handleBusinessChange,
    setBusinessData
  };
}
