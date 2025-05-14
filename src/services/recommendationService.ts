import { BrowserAIService } from '@/services/ai/browserAI';
import { supabase } from '@/integrations/supabase/client';
import { 
  Recommendations, 
  AnalysisResult 
} from '@/types/recommendations';
import { BusinessType } from '@/types/businessTypes';
import { type AIProvider } from '@/components/AIProviderToggle';

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
  
  async generateRecommendations(analysisData: AnalysisResult): Promise<Recommendations> {
    try {
      if (this.provider === 'api') {
        return await this.generateApiRecommendations(analysisData);
      } else {
        return await this.browserService.generateRecommendations(
          analysisData,
          analysisData.reviews,
          analysisData.businessType
        );
      }
    } catch (error) {
      console.error('Primary AI failed, falling back to browser AI', error);
      
      // Fallback to browser AI if API fails
      if (this.provider === 'api') {
        try {
          return await this.browserService.generateRecommendations(
            analysisData,
            analysisData.reviews,
            analysisData.businessType
          );
        } catch (fallbackError) {
          console.error('Fallback to browser AI also failed', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }
  
  private async generateApiRecommendations(analysisData: AnalysisResult): Promise<Recommendations> {
    // Get the API provider and key
    const apiProvider = localStorage.getItem('AI_PROVIDER') || 'openai';
    const apiKey = localStorage.getItem(`${apiProvider.toUpperCase()}_API_KEY`);
    
    if (!apiKey) {
      throw new Error(`No API key found for ${apiProvider}`);
    }
    
    const { data, error } = await supabase.functions.invoke('generate-recommendations', {
      body: {
        analysisData,
        businessType: analysisData.businessType,
        provider: apiProvider,
        apiKey
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
