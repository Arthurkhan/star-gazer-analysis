import { BusinessType } from '@/types/businessTypes';

/**
 * Maps business names to their business types
 */
export const BUSINESS_TYPE_MAPPINGS: Record<string, BusinessType> = {
  "The Little Prince Cafe": BusinessType.CAFE,
  "Vol de Nuit, The Hidden Bar": BusinessType.BAR,
  "L'Envol Art Space": BusinessType.GALLERY
};

/**
 * Get the business type from a business name
 */
export const getBusinessTypeFromName = (businessName: string): BusinessType => {
  return BUSINESS_TYPE_MAPPINGS[businessName] || BusinessType.OTHER;
};

/**
 * Get all business mappings as an array of objects
 */
export const getAllBusinessMappings = (): Array<{name: string, type: BusinessType}> => {
  return Object.entries(BUSINESS_TYPE_MAPPINGS).map(([name, type]) => ({
    name,
    type
  }));
};
