import { useState, useCallback, useRef, useEffect } from "react";
import { BusinessData } from "@/types/reviews";

/**
 * Business selection hook with optimizations to prevent infinite loops
 * This hook manages the selected business state and related data.
 */
export function useBusinessSelection() {
  // Initial state from localStorage (with fallback to "all")
  const initialBusiness = localStorage.getItem("selectedBusiness") || "all";
  
  // State for the selected business
  const [selectedBusiness, setSelectedBusiness] = useState<string>(initialBusiness);
  
  // State for business data
  const [businessData, setBusinessData] = useState<BusinessData>({
    allBusinesses: { name: "All Businesses", count: 0 },
    businesses: {},
  });
  
  // Ref to track if initial setup has been done
  const isInitialized = useRef(false);
  
  // Save to localStorage when selection changes
  useEffect(() => {
    // Save selected business to localStorage
    localStorage.setItem("selectedBusiness", selectedBusiness);
  }, [selectedBusiness]);
  
  // Handle business selection change
  const handleBusinessChange = useCallback((business: string) => {
    setSelectedBusiness(business);
  }, []);
  
  // Initialize with defaults once
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      // Any one-time initialization can go here
    }
  }, []);

  return {
    selectedBusiness,
    businessData,
    handleBusinessChange,
    setBusinessData
  };
}
