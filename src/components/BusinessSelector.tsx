
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BusinessData } from "@/types/reviews";
import { BusinessType } from "@/types/businessTypes";
import { BusinessTypeBadge } from "@/components/BusinessTypeBadge";
import { Settings } from "lucide-react";
import { useState } from "react";
import { BusinessDetailsDialog } from "./BusinessDetailsDialog";

interface BusinessSelectorProps {
  selectedBusiness: string;
  onBusinessChange: (business: string) => void;
  businessData: BusinessData;
  businessType: BusinessType;
  onBusinessTypeChange: (businessType: BusinessType) => void;
  className?: string;
}

const BusinessSelector = ({
  selectedBusiness,
  onBusinessChange,
  businessData,
  businessType,
  onBusinessTypeChange,
  className = "",
}: BusinessSelectorProps) => {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Generate business options dynamically from the businessData
  const businessOptions = [
    { id: "all", name: "All Businesses" },
    ...Object.entries(businessData.businesses).map(([id, data]) => ({
      id,
      name: data.name,
    })),
  ];

  const businessTypes = [
    { value: BusinessType.CAFE, label: "Cafe" },
    { value: BusinessType.BAR, label: "Bar" },
    { value: BusinessType.RESTAURANT, label: "Restaurant" },
    { value: BusinessType.GALLERY, label: "Gallery" },
    { value: BusinessType.RETAIL, label: "Retail" },
    { value: BusinessType.SERVICE, label: "Service" },
    { value: BusinessType.OTHER, label: "Other" },
  ];

  return (
    <Card className={`border-0 shadow-md dark:bg-gray-800 ${className}`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Business Dashboard
                </h2>
                {selectedBusiness !== "all" && (
                  <BusinessTypeBadge businessType={businessType} />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {selectedBusiness === "all"
                  ? `Viewing all businesses (${businessData.allBusinesses.count} reviews)`
                  : `Viewing ${selectedBusiness} (${
                      businessData.businesses[selectedBusiness]?.count || 0
                    } reviews)`}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedBusiness}
                onValueChange={onBusinessChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businessOptions.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBusiness !== "all" && (
              <div className="flex items-center gap-2">
                <div className="w-full">
                  <Select
                    value={businessType}
                    onValueChange={(value) => onBusinessTypeChange(value as BusinessType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Add details button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailsDialogOpen(true)}
                  className="ml-1 h-10 w-10"
                  title="Business Details"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Business Details Dialog */}
        <BusinessDetailsDialog
          businessName={selectedBusiness}
          businessType={businessType}
          isOpen={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      </CardContent>
    </Card>
  );
};

export default BusinessSelector;
