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
