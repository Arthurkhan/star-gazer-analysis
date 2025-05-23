import { Review } from "@/types/reviews";
import { logger } from "@/utils/logger";

/**
 * Dashboard-specific utility functions
 */

/**
 * Format business name for display
 * 
 * @param businessName - Raw business name
 * @returns Formatted business name
 */
export const formatBusinessName = (businessName: string): string => {
  if (businessName === "all" || businessName === "All Businesses") {
    return "All Businesses";
  }
  return businessName;
};

/**
 * Get dashboard metrics summary
 * 
 * @param reviews - Array of reviews
 * @param selectedBusiness - Currently selected business
 * @returns Dashboard metrics object
 */
export const getDashboardMetrics = (reviews: Review[], selectedBusiness: string): {
  totalReviews: number;
  businessName: string;
  isAllBusinesses: boolean;
} => {
  return {
    totalReviews: reviews.length,
    businessName: formatBusinessName(selectedBusiness),
    isAllBusinesses: selectedBusiness === "all" || selectedBusiness === "All Businesses"
  };
};

/**
 * Validate business selection
 * 
 * @param businessName - Business name to validate
 * @param availableBusinesses - List of available businesses
 * @returns boolean - Whether the business is valid
 */
export const validateBusinessSelection = (businessName: string, availableBusinesses: string[]): boolean => {
  if (businessName === "all" || businessName === "All Businesses") {
    return true;
  }
  return availableBusinesses.includes(businessName);
};

/**
 * Log dashboard state changes
 * 
 * @param action - Action being performed
 * @param data - Additional data to log
 */
export const logDashboardAction = (action: string, data?: any): void => {
  logger.info('dashboard', `${action}`, data);
};
