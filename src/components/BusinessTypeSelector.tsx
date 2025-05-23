import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Coffee, Wine, Palette, Building } from 'lucide-react';

export type BusinessType = 'CAFE' | 'BAR' | 'GALLERY' | 'ALL';

export interface BusinessTypeOption {
  value: BusinessType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  businesses: string[];
}

const businessTypeOptions: BusinessTypeOption[] = [
  {
    value: 'ALL',
    label: 'All Businesses',
    description: 'View data from all business types',
    icon: <Building className="h-4 w-4" />,
    color: 'blue',
    businesses: ['The Little Prince Cafe', 'Vol de Nuit The Hidden Bar', "L'Envol Art Space"],
  },
  {
    value: 'CAFE',
    label: 'Cafe',
    description: 'Coffee shops and cafes',
    icon: <Coffee className="h-4 w-4" />,
    color: 'amber',
    businesses: ['The Little Prince Cafe'],
  },
  {
    value: 'BAR',
    label: 'Bar',
    description: 'Bars and lounges',
    icon: <Wine className="h-4 w-4" />,
    color: 'purple',
    businesses: ['Vol de Nuit The Hidden Bar'],
  },
  {
    value: 'GALLERY',
    label: 'Art Gallery',
    description: 'Art galleries and exhibition spaces',
    icon: <Palette className="h-4 w-4" />,
    color: 'green',
    businesses: ["L'Envol Art Space"],
  },
];

export interface BusinessTypeSelectorProps {
  selectedType: BusinessType;
  onTypeChange: (type: BusinessType) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'cards';
  showDescription?: boolean;
  showBusinessCount?: boolean;
}

export const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = '',
  variant = 'default',
  showDescription = true,
  showBusinessCount = true,
}) => {
  const selectedOption = businessTypeOptions.find(option => option.value === selectedType) 
    || businessTypeOptions[0];

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`justify-between min-w-[180px] ${className}`}
          >
            <div className="flex items-center gap-2">
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
              {showBusinessCount && (
                <Badge variant="secondary" className="ml-1">
                  {selectedOption.businesses.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          {businessTypeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              className="flex items-center gap-2 p-3"
            >
              <div className="flex items-center gap-2 flex-1">
                {option.icon}
                <div>
                  <div className="font-medium">{option.label}</div>
                  {showDescription && (
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
              {showBusinessCount && (
                <Badge variant="outline">
                  {option.businesses.length}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {businessTypeOptions.map((option) => (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === option.value
                ? 'ring-2 ring-primary shadow-md'
                : 'hover:shadow-lg'
            }`}
            onClick={() => onTypeChange(option.value)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <CardTitle className="text-sm">{option.label}</CardTitle>
                </div>
                {showBusinessCount && (
                  <Badge
                    variant={selectedType === option.value ? 'default' : 'secondary'}
                  >
                    {option.businesses.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            {showDescription && (
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {option.description}
                </CardDescription>
                <div className="mt-2">
                  {option.businesses.map((business, index) => (
                    <div key={business} className="text-xs text-muted-foreground">
                      {business}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  }

  // Default variant - button group
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {businessTypeOptions.map((option) => {
        const isSelected = selectedType === option.value;
        return (
          <Button
            key={option.value}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(option.value)}
            className="flex items-center gap-2"
          >
            {option.icon}
            <span>{option.label}</span>
            {showBusinessCount && (
              <Badge
                variant={isSelected ? 'secondary' : 'outline'}
                className="ml-1"
              >
                {option.businesses.length}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default BusinessTypeSelector;

// Utility functions for business type handling
export const getBusinessTypeFromName = (businessName: string): BusinessType => {
  if (businessName.toLowerCase().includes('cafe') || businessName.toLowerCase().includes('coffee')) {
    return 'CAFE';
  }
  if (businessName.toLowerCase().includes('bar') || businessName.toLowerCase().includes('nuit')) {
    return 'BAR';
  }
  if (businessName.toLowerCase().includes('art') || businessName.toLowerCase().includes('gallery') || businessName.toLowerCase().includes('envol')) {
    return 'GALLERY';
  }
  return 'ALL';
};

export const getBusinessesForType = (type: BusinessType): string[] => {
  const option = businessTypeOptions.find(opt => opt.value === type);
  return option ? option.businesses : [];
};

export const getBusinessTypeMetadata = (type: BusinessType): BusinessTypeOption | undefined => {
  return businessTypeOptions.find(opt => opt.value === type);
};

export { businessTypeOptions };
