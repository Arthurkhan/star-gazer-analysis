import { useState, useCallback } from 'react'

/**
 * Simplified Business Selection Hook
 * Removes circular dependencies and complex state management
 * Now just a simple state container
 */
export function useBusinessSelection() {
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all')
  const [businessData, setBusinessData] = useState({
    allBusinesses: { name: 'All Businesses', count: 0 },
    businesses: {} as Record<string, any>,
  })

  const handleBusinessChange = useCallback((businessName: string) => {
    setSelectedBusiness(businessName)
  }, [])

  return {
    selectedBusiness,
    businessData,
    handleBusinessChange,
    setBusinessData,
  }
}
