import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getBusinessContext } from '@/utils/businessContext'

interface BusinessContextDisplayProps {
  businessName: string;
}

export function BusinessContextDisplay({ businessName }: BusinessContextDisplayProps) {
  const context = getBusinessContext(businessName)

  if (!context || businessName === 'all') {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Business Context Used</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Type: {context.businessType}
          </Badge>

          {context.location?.country && context.location?.city && (
            <Badge variant="secondary">
              Location: {context.location.city}, {context.location.country}
            </Badge>
          )}

          {context.hoursType && (
            <Badge variant="secondary">
              Hours: {formatHoursType(context.hoursType)}
            </Badge>
          )}

          {context.priceRange && (
            <Badge variant="secondary">
              Price: {formatPriceRange(context.priceRange)}
            </Badge>
          )}

          {context.specialties && context.specialties.length > 0 && (
            <Badge variant="secondary">
              Specialties: {context.specialties.slice(0, 3).join(', ')}
              {context.specialties.length > 3 ? '...' : ''}
            </Badge>
          )}

          {context.customerTypes && context.customerTypes.length > 0 && (
            <Badge variant="secondary">
              Customers: {context.customerTypes.slice(0, 3).join(', ')}
              {context.customerTypes.length > 3 ? '...' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatHoursType(hoursType: string): string {
  switch (hoursType) {
    case 'standard': return 'Standard (9am-5pm)'
    case 'extended': return 'Extended Hours'
    case 'evening': return 'Evening/Night'
    case '24hour': return '24 Hours'
    case 'weekends': return 'Weekends Only'
    default: return hoursType
  }
}

function formatPriceRange(priceRange: string): string {
  switch (priceRange) {
    case 'budget': return 'Budget ($)'
    case 'medium': return 'Mid-range ($$)'
    case 'premium': return 'Premium ($$$)'
    case 'luxury': return 'Luxury ($$$$)'
    default: return priceRange
  }
}

export default BusinessContextDisplay
