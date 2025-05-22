import { useState, useCallback, useRef, useEffect } from "react";
import { BusinessData } from "@/types/reviews";

/**
 * Business selection hook with complete optimization to prevent infinite loops
 * This hook manages ONLY the selected business state and related data.
 * It does NOT depend on external review data to prevent circular dependencies.
 */
export function useBusinessSelection() {
  // Initial state from localStorage (with fallback to "all")
  const initialBusiness = localStorage.getItem("selectedBusiness") || "all";
  
  // State for the selected business
  const [selectedBusiness, setSelectedBusiness] = useState<string>(initialBusiness);
  
  // State for business data - initialized with empty state
  const [businessData, setBusinessData] = useState<BusinessData>({
    allBusinesses: { name: "All Businesses", count: 0 },
    businesses: {},
  });
  
  // Ref to track initialization and prevent unnecessary updates
  const isInitialized = useRef(false);
  const lastSavedBusiness = useRef<string>(initialBusiness);
  
  // Save to localStorage when selection changes (debounced)
  useEffect(() => {
    // Only save if the business has actually changed
    if (selectedBusiness !== lastSavedBusiness.current) {
      lastSavedBusiness.current = selectedBusiness;
      
      // Debounce localStorage writes to prevent excessive operations
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem("selectedBusiness", selectedBusiness);
          console.log(`Business selection saved to localStorage: ${selectedBusiness}`);
        } catch (error) {
          console.warn("Failed to save business selection to localStorage:", error);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedBusiness]);
  
  // Handle business selection change - optimized callback
  const handleBusinessChange = useCallback((business: string) => {
    console.log(`Business selection changing to: ${business}`);
    setSelectedBusiness(business);
  }, []);
  
  // Optimized setBusinessData callback to prevent unnecessary re-renders
  const setBusinessDataOptimized = useCallback((newData: BusinessData | ((prev: BusinessData) => BusinessData)) => {
    setBusinessData(prevData => {
      const updatedData = typeof newData === 'function' ? newData(prevData) : newData;
      
      // Only update if data has actually changed
      if (JSON.stringify(prevData) === JSON.stringify(updatedData)) {
        return prevData; // Return previous data to prevent re-render
      }
      
      console.log("Business data updated:", {
        allBusinessesCount: updatedData.allBusinesses.count,
        businessCount: Object.keys(updatedData.businesses).length
      });
      
      return updatedData;
    });
  }, []);
  
  // Initialize once
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log(`Business selection hook initialized with: ${selectedBusiness}`);
    }
  }, [selectedBusiness]);

  return {
    selectedBusiness,
    businessData,
    handleBusinessChange,
    setBusinessData: setBusinessDataOptimized
  };
}