import { BusinessType } from './businessTypes'

/**
 * Maps business names to their types
 * This provides a consistent way to determine business types from names
 */
const businessTypeMap: Record<string, BusinessType> = {
  'The Little Prince Cafe': BusinessType.CAFE,
  'Vol de Nuit, The Hidden Bar': BusinessType.BAR,
  "L'Envol Art Space": BusinessType.GALLERY,
}

/**
 * Get business type from business name
 * @param businessName The name of the business
 * @returns The business type
 */
export function getBusinessTypeFromName(businessName: string): BusinessType {
  return businessTypeMap[businessName] || BusinessType.OTHER
}

/**
 * Maps business types to their display names
 */
export const businessTypeLabels: Record<BusinessType, string> = {
  [BusinessType.CAFE]: 'Café',
  [BusinessType.BAR]: 'Bar',
  [BusinessType.GALLERY]: 'Art Gallery',
  [BusinessType.OTHER]: 'Business',
}

/**
 * Get all known business names
 * @returns Array of known business names
 */
export function getKnownBusinessNames(): string[] {
  return Object.keys(businessTypeMap)
}

/**
 * Check if a business name is known
 * @param businessName The name of the business
 * @returns True if the business name is known
 */
export function isKnownBusiness(businessName: string): boolean {
  return !!businessTypeMap[businessName]
}
