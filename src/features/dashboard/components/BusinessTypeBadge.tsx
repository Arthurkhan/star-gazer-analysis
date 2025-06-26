import React from 'react'
import { Badge } from '@/components/ui/badge'
import { BusinessType } from '@/types/businessTypes'
import {
  Coffee,
  Wine,
  Utensils,
  Palette,
  ShoppingBag,
  Wrench,
  Building,
} from 'lucide-react'

interface BusinessTypeBadgeProps {
  businessType: BusinessType;
  className?: string;
}

export const BusinessTypeBadge: React.FC<BusinessTypeBadgeProps> = ({
  businessType,
  className = '',
}) => {
  const getIcon = () => {
    switch (businessType) {
      case BusinessType.CAFE:
        return <Coffee className="w-3 h-3" />
      case BusinessType.BAR:
        return <Wine className="w-3 h-3" />
      case BusinessType.RESTAURANT:
        return <Utensils className="w-3 h-3" />
      case BusinessType.GALLERY:
        return <Palette className="w-3 h-3" />
      case BusinessType.RETAIL:
        return <ShoppingBag className="w-3 h-3" />
      case BusinessType.SERVICE:
        return <Wrench className="w-3 h-3" />
      default:
        return <Building className="w-3 h-3" />
    }
  }

  const getColor = () => {
    switch (businessType) {
      case BusinessType.CAFE:
        return 'bg-amber-500'
      case BusinessType.BAR:
        return 'bg-purple-500'
      case BusinessType.RESTAURANT:
        return 'bg-orange-500'
      case BusinessType.GALLERY:
        return 'bg-pink-500'
      case BusinessType.RETAIL:
        return 'bg-blue-500'
      case BusinessType.SERVICE:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatLabel = () => {
    return businessType.charAt(0).toUpperCase() + businessType.slice(1)
  }

  return (
    <Badge
      className={`flex items-center gap-1 ${getColor()} text-white ${className}`}
    >
      {getIcon()}
      {formatLabel()}
    </Badge>
  )
}

export default BusinessTypeBadge
