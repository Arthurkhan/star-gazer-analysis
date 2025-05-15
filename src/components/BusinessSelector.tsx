
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessTypeBadge } from "@/components/BusinessTypeBadge";
import { BusinessData } from "@/types/reviews";
import { BusinessType } from "@/types/businessTypes";

interface BusinessSelectorProps {
  selectedBusiness: string;
  onBusinessChange: (business: string) => void;
  businessData: BusinessData;
  businessType?: BusinessType | null;
  className?: string;
}

const BusinessSelector = ({
  selectedBusiness,
  onBusinessChange,
  businessData,
  businessType,
  className = "",
}: BusinessSelectorProps) => {
  // Generate business options dynamically from the businessData
  const businessOptions = [
    { id: "all", name: "All Businesses" },
    ...Object.entries(businessData.businesses).map(([id, data]) => ({
      id,
      name: data.name,
    })),
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
                {businessType && selectedBusiness !== "all" && (
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
          <div className="w-full">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessSelector;
