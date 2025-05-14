import { BrowserAIService } from '@/services/ai/browserAI';
import { supabase } from '@/integrations/supabase/client';
import { 
  Recommendations, 
  BusinessType 
} from '@/types/recommendations';
import { Review } from '@/types/reviews';

interface AnalysisResult {
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: string }[];
  commonTerms: { text: string; count: number }[];
  mainThemes?: { theme: string; count: number; percentage: number }[];
  overallAnalysis: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
}

export type AIProvider = 'browser' | 'api';

export class RecommendationService {
  private browserService: BrowserAIService;
  private provider: AIProvider;
  
  constructor(provider: AIProvider = 'browser') {
    this.browserService = new BrowserAIService();
    this.provider = provider;
  }
  
  setProvider(provider: AIProvider) {
    this.provider = provider;
  }
  
  async generateRecommendations(
    analysisData: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType = BusinessType.OTHER
  ): Promise<Recommendations> {
    try {
      if (this.provider === 'api') {
        return await this.generateApiRecommendations(analysisData, reviews, businessType);
      } else {
        return await this.browserService.generateRecommendations(analysisData, reviews, businessType);
      }
    } catch (error) {
      console.error('Primary AI failed, falling back to browser AI', error);
      
      // Fallback to browser AI if API fails
      if (this.provider === 'api') {
        try {
          return await this.browserService.generateRecommendations(analysisData, reviews, businessType);
        } catch (fallbackError) {
          console.error('Fallback to browser AI also failed', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }
  
  private async generateApiRecommendations(
    analysisData: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType
  ): Promise<Recommendations> {
    // Get the API provider from localStorage
    const apiProvider = localStorage.getItem('AI_PROVIDER') || 'openai';
    const apiKey = localStorage.getItem(`${apiProvider.toUpperCase()}_API_KEY`);
    
    if (!apiKey) {
      throw new Error(`No API key found for ${apiProvider}`);
    }
    
    // Add average rating to analysis data
    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    const enrichedAnalysisData = {
      ...analysisData,
      avgRating
    };
    
    const { data, error } = await supabase.functions.invoke('generate-recommendations', {
      body: {
        analysisData: enrichedAnalysisData,
        reviews: reviews.slice(0, 50), // Send only recent reviews to avoid token limits
        businessType,
        provider: apiProvider
      }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
    
    return data;
  }
  
  // Check if API provider is configured
  isApiConfigured(): boolean {
    if (this.provider !== 'api') return true;
    
    const apiProvider = localStorage.getItem('AI_PROVIDER') || 'openai';
    const apiKey = localStorage.getItem(`${apiProvider.toUpperCase()}_API_KEY`);
    
    return !!apiKey;
  }
  
  // Get current provider
  getCurrentProvider(): AIProvider {
    return this.provider;
  }
}

// Singleton instance
let recommendationService: RecommendationService | null = null;

export function getRecommendationService(provider?: AIProvider): RecommendationService {
  if (!recommendationService) {
    recommendationService = new RecommendationService(provider);
  } else if (provider && recommendationService.getCurrentProvider() !== provider) {
    recommendationService.setProvider(provider);
  }
  
  return recommendationService;
}
