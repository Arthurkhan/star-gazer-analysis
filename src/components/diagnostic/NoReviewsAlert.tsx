import { useDashboardData } from "@/hooks/useDashboardData";
import { BusinessData } from "@/types/reviews";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface NoReviewsAlertProps {
  businessData: BusinessData;
  selectedBusiness: string;
}

export const NoReviewsAlert = ({ businessData, selectedBusiness }: NoReviewsAlertProps) => {
  const businessInfo = selectedBusiness === 'all' 
    ? businessData.allBusinesses 
    : businessData.businesses[selectedBusiness];
    
  return (
    <Alert variant="warning" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>No reviews found</AlertTitle>
      <AlertDescription>
        <p>
          {selectedBusiness === 'all'
            ? `No reviews found for any businesses.`
            : `No reviews found for ${selectedBusiness}.`
          }
        </p>
        <p className="mt-2">
          Database is connected, but no reviews were found for the selected time period.
        </p>
      </AlertDescription>
    </Alert>
  );
};
