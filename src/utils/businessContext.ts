export interface BusinessContext {
  businessType: string;
  location?: {
    country: string;
    city: string;
  };
  businessHours?: {
    [day: string]: { open: string; close: string };
  };
  hoursType?: 'standard' | 'extended' | 'evening' | '24hour' | 'weekends';
  specialties?: string[];
  priceRange?: 'budget' | 'medium' | 'premium' | 'luxury';
  customerTypes?: string[];
}

export function saveBusinessContext(businessName: string, context: BusinessContext): void {
  const key = `sg_bizcontext_${businessName.replace(/\s+/g, '_').toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(context));
}

export function getBusinessContext(businessName: string): BusinessContext | null {
  const key = `sg_bizcontext_${businessName.replace(/\s+/g, '_').toLowerCase()}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}
