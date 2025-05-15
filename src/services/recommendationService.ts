import { BrowserAIService } from '@/services/ai/browserAI';
import { AIServiceFactory, defaultConfigs } from '@/services/ai/aiServiceFactory';
import { supabase } from '@/integrations/supabase/client';
import { 
  Recommendations, 
  AnalysisResult 
} from '@/types/recommendations';
import { BusinessType } from '@/types/businessTypes';
import { AIProviderType, BusinessContext, ReviewAnalysis } from '@/types/aiService';
import { Review } from '@/types/reviews';
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
    const apiProvider = localStorage.getItem('AI_PROVIDER') as AIProviderType || 'openai';
    const apiKey = localStorage.getItem(`${apiProvider.toUpperCase()}_API_KEY`);
    
    if (!apiKey) {
      throw new Error(`No API key found for ${apiProvider}`);
    }
    
    // Create AI provider instance
    const aiService = AIServiceFactory.createProvider({
      provider: apiProvider,
      apiKey,
      ...defaultConfigs[apiProvider]
    });
    
    // Convert analysis data to business context
    const businessContext: BusinessContext = {
      businessName: analysisData.business,
      businessType: analysisData.businessType,
      reviews: analysisData.reviews,
      metrics: analysisData.metrics,
      analysis: await this.convertToReviewAnalysis(analysisData),
      historicalTrends: analysisData.patterns
    };
    
    // Generate recommendations using the AI provider
    const recommendations = await aiService.generateRecommendations(businessContext);
    
    // Generate additional components if not provided
    if (!recommendations.customerAttractionPlan) {
      recommendations.customerAttractionPlan = await aiService.generateMarketingPlan(businessContext);
    }
    
    if (!recommendations.scenarios || recommendations.scenarios.length === 0) {
      recommendations.scenarios = await aiService.generateScenarios(businessContext);
    }
    
    return recommendations;
  }
  
  private async convertToReviewAnalysis(analysisData: AnalysisResult): Promise<ReviewAnalysis> {
    // Convert the existing analysis format to the new ReviewAnalysis format
    const sentiment = analysisData.sentimentAnalysis || [];
    const totalSentiment = sentiment.reduce((sum, s) => sum + s.value, 0) || 1;
    
    return {
      sentiment: {
        overall: sentiment.find(s => s.name === 'Positive')?.value / totalSentiment || 0.5,
        breakdown: {
          positive: sentiment.find(s => s.name === 'Positive')?.value || 0,
          neutral: sentiment.find(s => s.name === 'Neutral')?.value || 0,
          negative: sentiment.find(s => s.name === 'Negative')?.value || 0
        }
      },
      themes: (analysisData.commonTerms || []).map(term => ({
        name: term.text,
        frequency: term.count,
        sentiment: 'neutral' as const,
        examples: []
      })),
      painPoints: [],
      strengths: [],
      customerSegments: []
    };
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
