import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessType } from "@/types/businessTypes";

interface BusinessTypeSelectorProps {
  selectedBusinessType: BusinessType;
  onBusinessTypeChange: (businessType: BusinessType) => void;
  disabled?: boolean;
}

const BusinessTypeSelector = ({
  selectedBusinessType,
  onBusinessTypeChange,
  disabled = false,
}: BusinessTypeSelectorProps) => {
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
    <Select
      value={selectedBusinessType}
      onValueChange={(value) => onBusinessTypeChange(value as BusinessType)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select business type" />
      </SelectTrigger>
      <SelectContent>
        {businessTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BusinessTypeSelector;
