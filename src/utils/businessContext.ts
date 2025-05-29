export interface BusinessContext {
  businessType: string;
  
  // Location Details
  location?: {
    country: string;
    city: string;
    neighborhood?: string; // More granular location info
  };
  
  // Operating Details
  operatingDays?: string[]; // Which days open (e.g., ["Monday", "Tuesday", ...])
  peakHours?: string; // e.g., "12pm-2pm, 6pm-9pm"
  averageTransaction?: string; // e.g., "$15-20"
  seatingCapacity?: number; // For physical locations
  currency?: string; // e.g., "USD", "THB", "EUR"
  
  // Business Characteristics
  specialties?: string[];
  priceRange?: 'budget' | 'medium' | 'premium' | 'luxury';
  customerTypes?: string[];
  
  // Market Position
  mainCompetitors?: string[]; // Names of main competitors
  uniqueSellingPoints?: string[]; // What makes this business special
  
  // Online Presence
  onlinePresence?: {
    website?: boolean;
    instagram?: boolean;
    facebook?: boolean;
    googleMyBusiness?: boolean;
    deliveryApps?: string[]; // e.g., ["UberEats", "DoorDash"]
  };
  
  // Business Goals & Challenges
  currentChallenges?: string[]; // Main pain points
  businessGoals?: string; // Short-term objectives
  
  // Additional Context - Free form for AI
  additionalContext?: string; // Any other relevant information for AI
  
  // Legacy field - keeping for backward compatibility
  hoursType?: 'standard' | 'extended' | 'evening' | '24hour' | 'weekends';
  businessHours?: {
    [day: string]: { open: string; close: string };
  };
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

// Simple country to currency mapping
export const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
  // Asia
  'thailand': 'THB',
  'japan': 'JPY',
  'china': 'CNY',
  'india': 'INR',
  'singapore': 'SGD',
  'malaysia': 'MYR',
  'indonesia': 'IDR',
  'philippines': 'PHP',
  'vietnam': 'VND',
  'south korea': 'KRW',
  
  // Americas
  'united states': 'USD',
  'usa': 'USD',
  'canada': 'CAD',
  'mexico': 'MXN',
  'brazil': 'BRL',
  'argentina': 'ARS',
  
  // Europe
  'united kingdom': 'GBP',
  'uk': 'GBP',
  'germany': 'EUR',
  'france': 'EUR',
  'italy': 'EUR',
  'spain': 'EUR',
  'netherlands': 'EUR',
  'belgium': 'EUR',
  'switzerland': 'CHF',
  'sweden': 'SEK',
  'norway': 'NOK',
  'denmark': 'DKK',
  'poland': 'PLN',
  
  // Oceania
  'australia': 'AUD',
  'new zealand': 'NZD',
  
  // Middle East & Africa
  'uae': 'AED',
  'saudi arabia': 'SAR',
  'south africa': 'ZAR',
  'egypt': 'EGP',
  'israel': 'ILS',
};

// Common currencies for the dropdown
export const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

export function getDefaultCurrency(country: string): string {
  const normalizedCountry = country.toLowerCase().trim();
  return COUNTRY_CURRENCY_MAP[normalizedCountry] || 'USD';
}
