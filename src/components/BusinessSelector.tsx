import { Building2, Users, MapPin, TrendingUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { BusinessType } from '@/types/businessTypes'
import { getBusinessTypeFromName, getKnownBusinessNames } from '@/types/BusinessMappings'
import { cn } from '@/lib/utils'

interface BusinessData {
  totalReviews: number;
  avgRating: number;
  recentTrend: 'up' | 'down' | 'stable';
}

interface BusinessSelectorProps {
  selectedBusiness: string;
  onBusinessChange: (business: string) => void;
  businessData?: Record<string, BusinessData>;
  className?: string;
}

const businessIcons: Record<BusinessType | 'all', React.ComponentType<any>> = {
  cafe: Building2,
  bar: Building2,
  restaurant: Building2,
  gallery: Building2,
  retail: Building2,
  service: Building2,
  other: Building2,
  all: Users,
}

const businessColors: Record<BusinessType | 'all', string> = {
  cafe: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100',
  bar: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100',
  restaurant: 'bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-100',
  gallery: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
  retail: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
  service: 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100',
  other: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  all: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100',
}

export default function BusinessSelector({
  selectedBusiness,
  onBusinessChange,
  businessData,
  className,
}: BusinessSelectorProps) {
  // Get all known business names
  const allBusinesses = getKnownBusinessNames()

  const getBusinessType = (name: string): BusinessType | 'all' => {
    if (name === 'all') return 'all'
    return getBusinessTypeFromName(name)
  }

  const getBusinessStats = (businessName: string) => {
    if (!businessData || businessName === 'all') return null
    return businessData[businessName]
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return null

    if (trend === 'up') {
      return <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
    } else if (trend === 'down') {
      return <TrendingUp className="h-3 w-3 text-red-600 dark:text-red-400 rotate-180" />
    }
    return <span className="h-3 w-3 text-gray-400">—</span>
  }

  return (
    <Select value={selectedBusiness} onValueChange={onBusinessChange}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Select a business">
          <div className="flex items-center gap-2 truncate">
            {(() => {
              const type = getBusinessType(selectedBusiness)
              const Icon = businessIcons[type]
              const stats = getBusinessStats(selectedBusiness)

              return (
                <>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{selectedBusiness}</span>
                  {stats && (
                    <div className="hidden sm:flex items-center gap-2 ml-auto">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {stats.totalReviews} reviews
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        ★ {stats.avgRating.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="all" className="py-3">
          <div className="flex items-center gap-3">
            <div className={cn('p-1.5 rounded', businessColors.all)}>
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium">All Businesses</div>
              <div className="text-xs text-muted-foreground">
                Combined data from all locations
              </div>
            </div>
          </div>
        </SelectItem>

        <div className="my-1 h-px bg-border" />

        {allBusinesses.map((business) => {
          const type = getBusinessType(business)
          const Icon = businessIcons[type]
          const stats = getBusinessStats(business)
          const colorClass = businessColors[type]

          return (
            <SelectItem key={business} value={business} className="py-3">
              <div className="flex items-center gap-3 w-full">
                <div className={cn('p-1.5 rounded flex-shrink-0', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    <span className="truncate">{business}</span>
                    {stats && (
                      <span className="hidden sm:inline-flex items-center">
                        {getTrendIcon(stats.recentTrend)}
                      </span>
                    )}
                  </div>
                  {stats && (
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>{stats.totalReviews} reviews</span>
                      <span>★ {stats.avgRating.toFixed(1)}</span>
                      <span className="hidden sm:inline">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {type}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
