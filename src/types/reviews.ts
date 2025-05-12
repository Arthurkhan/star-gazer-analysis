export interface Review {
  id?: number;
  name: string;
  text: string;
  textTranslated?: string;
  title?: string;
  star: number;
  publishedAtDate: string;
  responseFromOwnerText?: string;
  originalLanguage?: string;
  reviewUrl?: string;
  // Add new fields for AI analysis
  sentiment?: 'positive' | 'negative' | 'neutral';
  staffMentioned?: string;
  mainThemes?: string;
}

// Add these new interfaces to the bottom of the file
export interface ThemeCategory {
  name: string;
  color: string;
  keywords: string[];
}

export interface FilterOptions {
  category: string | null;
  sortBy: 'count' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}
