import { useState } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BusinessData } from '@/types/reviews'
import { BusinessType } from '@/types/businessTypes'
import { getBusinessTypeFromName } from '@/types/BusinessMappings'
import { Settings, ChevronDown, Check } from 'lucide-react'
// Note: These will be migrated to appropriate features
import { BusinessTypeBadge } from '@/components/BusinessTypeBadge'
import { BusinessDetailsDialog } from '@/components/BusinessDetailsDialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

interface BusinessSelectorProps {
  selectedBusiness: string;
  onBusinessChange: (business: string) => void;
  businessData: BusinessData;
  className?: string;
}

const BusinessSelector = ({
  selectedBusiness,
  onBusinessChange,
  businessData,
  className = '',
}: BusinessSelectorProps) => {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false)

  // Generate business options dynamically from the businessData
  const businessOptions = [
    { id: 'all', name: 'All Businesses' },
    ...Object.entries(businessData.businesses).map(([id, data]) => ({
      id,
      name: data.name,
    })),
  ]

  // Automatically determine business type from business name
  const businessType = selectedBusiness === 'all'
    ? BusinessType.OTHER
    : getBusinessTypeFromName(selectedBusiness)

  // Get the selected business name
  const getSelectedBusinessName = () => {
    if (selectedBusiness === 'all') return 'All Businesses'
    const found = businessOptions.find(opt => opt.id === selectedBusiness)
    return found ? found.name : selectedBusiness
  }

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
                {selectedBusiness !== 'all' && (
                  <BusinessTypeBadge businessType={businessType} />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {selectedBusiness === 'all'
                  ? `Viewing all businesses (${businessData.allBusinesses.count} reviews)`
                  : `Viewing ${selectedBusiness} (${
                      businessData.businesses[selectedBusiness]?.count || 0
                    } reviews)`}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              {/* Custom Business Dropdown */}
              <DropdownMenu.Root
                open={businessDropdownOpen}
                onOpenChange={setBusinessDropdownOpen}
              >
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    role="combobox"
                    aria-expanded={businessDropdownOpen}
                  >
                    {getSelectedBusinessName()}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 dark:border-gray-800 dark:bg-gray-950"
                    align="start"
                    sideOffset={5}
                  >
                    <DropdownMenu.RadioGroup
                      value={selectedBusiness}
                      onValueChange={(value) => {
                        onBusinessChange(value)
                        setBusinessDropdownOpen(false)
                      }}
                    >
                      {businessOptions.map((business) => (
                        <DropdownMenu.RadioItem
                          key={business.id}
                          value={business.id}
                          className={cn(
                            'relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800',
                            selectedBusiness === business.id && 'font-medium',
                          )}
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            {selectedBusiness === business.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </span>
                          {business.name}
                        </DropdownMenu.RadioItem>
                      ))}
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
            {selectedBusiness !== 'all' && (
              <div className="flex items-center gap-2">
                {/* Business type is now read-only and automatically determined */}
                <div className="text-sm text-gray-600 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                  Type: {businessType}
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
  )
}

export default BusinessSelector
