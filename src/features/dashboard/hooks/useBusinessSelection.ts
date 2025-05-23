import { useState, useCallback } from "react";
import { logger } from "@/utils/logger";

interface UseBusinessSelectionReturn {
  selectedBusiness: string;
  setSelectedBusiness: (business: string) => void;
  handleBusinessChange: (businessName: string) => void;
}

/**
 * Hook for managing business selection state
 * Focused responsibility: Business selection logic
 */
export function useBusinessSelection(initialBusiness = "all"): UseBusinessSelectionReturn {
  const [selectedBusiness, setSelectedBusiness] = useState<string>(initialBusiness);

  /**
   * Handle business selection change
   */
  const handleBusinessChange = useCallback((businessName: string) => {
    logger.info('business-selection', `Business selection changed to: ${businessName}`);
    setSelectedBusiness(businessName);
  }, []);

  return {
    selectedBusiness,
    setSelectedBusiness,
    handleBusinessChange,
  };
}
