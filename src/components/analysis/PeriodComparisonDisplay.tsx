import React from 'react'
import { EnhancedPeriodComparison } from './EnhancedPeriodComparison'

export function PeriodComparisonDisplay({
  businessName,
}: {
  businessName: string;
}) {
  // Use the enhanced period comparison component
  return <EnhancedPeriodComparison businessName={businessName} />
}
