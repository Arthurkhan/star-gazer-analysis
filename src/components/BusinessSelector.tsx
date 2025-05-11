
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessData } from "@/types/reviews";

interface BusinessSelectorProps {
  selectedBusiness: string;
  onBusinessChange: (business: string) => void;
  businessData: BusinessData;
}

const BusinessSelector = ({
  selectedBusiness,
  onBusinessChange,
  businessData,
}: BusinessSelectorProps) => {
  const businesses = [
    { id: "all", name: "All Businesses" },
    { id: "L'Envol Art Space", name: "L'Envol Art Space" },
    { id: "The Little Prince Cafe", name: "The Little Prince Cafe" },
    { id: "Vol de Nuit, The Hidden Bar", name: "Vol de Nuit, The Hidden Bar" },
  ];

  return (
    <Card className="mb-6 border-0 shadow-md dark:bg-gray-800">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Business Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {selectedBusiness === "all"
                ? `Viewing all businesses (${businessData.allBusinesses.count} reviews)`
                : `Viewing ${selectedBusiness} (${
                    businessData.businesses[selectedBusiness]?.count || 0
                  } reviews)`}
            </p>
          </div>
          <div className="w-full md:w-72">
            <Select
              value={selectedBusiness}
              onValueChange={onBusinessChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
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
