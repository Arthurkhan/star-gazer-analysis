import { BrowserAIService } from '@/services/ai/browserAI';
import { AIServiceFactory, defaultConfigs } from '@/services/ai/aiServiceFactory';
import { supabase } from '@/integrations/supabase/client';
import { 
  Recommendations, 
  AnalysisResult 
} from '@/types/recommendations';
import { BusinessType } from '@/types/businessTypes';
import { AIProviderType, BusinessContext, ReviewAnalysis } from '@/types/aiService';
import { Review, Business } from '@/types/reviews';
import { type AIProvider } from '@/components/AIProviderToggle';
import { enhancedDataAnalysisService } from '@/services/dataAnalysis/enhancedDataAnalysisService';
import { EnhancedAnalysis } from '@/types/dataAnalysis';
import { toast } from '@/hooks/use-toast';
import { getBusinessTypeFromName } from '@/types/BusinessMappings';
import { fetchBusinesses, getLatestRecommendation, saveRecommendation } from '@/services/reviewDataService';
import { getBusinessIdFromName } from '@/utils/reviewDataUtils';

// Circuit breaker states
enum CircuitState {
  CLOSED, // Normal operation
  OPEN,   // Failed, not allowing operations
  HALF_OPEN // Testing if system has recovered
}

export class RecommendationService {
  private browserService: BrowserAIService;
  private provider: AIProvider;
  
  // Circuit breaker configuration
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private failureThreshold: number = 3;
  private resetTimeout: number = 60000; // 1 minute
  private lastFailureTime: number = 0;
  
  constructor(provider: AIProvider = 'browser') {
    this.browserService = new BrowserAIService();
    this.provider = provider;
  }
  
  setProvider(provider: AIProvider) {
    this.provider = provider;
  }
  
  async generateRecommendations(params: {
    business: string | Business;
    businessType?: BusinessType;
    reviews: Review[];
    metrics: any;
    patterns?: any;
    sentiment?: any;
    [key: string]: any;
  }): Promise<Recommendations> {
    try {
      // Check if circuit breaker is open
      if (this.circuitState === CircuitState.OPEN) {
        // Check if timeout has elapsed to test again
        const now = Date.now();
        if (now - this.lastFailureTime > this.resetTimeout) {
          this.circuitState = CircuitState.HALF_OPEN;
          console.log('Circuit half-open, testing system recovery');
        } else {
          throw new Error(`System in recovery mode. Please try again in ${Math.ceil((this.resetTimeout - (now - this.lastFailureTime)) / 1000)} seconds`);
        }
      }
      
      // Extract business information
      let businessId: string;
      let businessName: string;
      let businessType: BusinessType;
      
      if (typeof params.business === 'string') {
        // If business is a string (name), get the business ID and type
        businessName = params.business;
        
        // First look for the business ID in the reviews
        businessId = getBusinessIdFromName(params.reviews, businessName) || '';
        
        // If not found in reviews, fetch all businesses and try to find it
        if (!businessId) {
          const businesses = await fetchBusinesses();
          const business = businesses.find(b => b.name === businessName);
          
          if (business) {
            businessId = business.id;
          } else {
            businessId = ''; // Default empty if not found
          }
        }
        
        businessType = params.businessType || getBusinessTypeFromName(businessName);
      } else {
        // If business is an object, extract properties
        businessId = params.business.id;
        businessName = params.business.name;
        businessType = params.businessType || params.business.business_type as BusinessType || BusinessType.OTHER;
      }
      
      // If we still don't have an ID, something is wrong
      if (!businessId) {
        console.warn('Could not find business ID for', businessName);
      }
      
      // Check for cached recommendations
      if (businessId) {
        const cachedRecommendation = await getLatestRecommendation(businessId);
        if (cachedRecommendation && (Date.now() - new Date(cachedRecommendation.created_at).getTime() < 24 * 60 * 60 * 1000)) {
          // Reset circuit breaker on successful cache retrieval
          if (this.circuitState === CircuitState.HALF_OPEN) {
            this.circuitState = CircuitState.CLOSED;
            this.failureCount = 0;
          }
          return cachedRecommendation.recommendations;
        }
      }
      
      // Log for debugging
      console.log('Generating recommendations with params:', {
        businessId,
        businessName,
        businessType,
        reviewCount: params.reviews?.length || 0,
        provider: this.provider
      });
      
      // Perform enhanced data analysis first
      let enhancedAnalysis;
      try {
        enhancedAnalysis = await enhancedDataAnalysisService.analyzeData(params.reviews);
      } catch (analysisError) {
        console.error('Enhanced analysis failed, continuing with basic analysis', analysisError);
        enhancedAnalysis = null;
      }
      
      let recommendations: Recommendations;
      
      if (this.provider === 'api') {
        recommendations = await this.generateApiRecommendations({
          ...params,
          businessId,
          businessName,
          businessType
        });
      } else {
        recommendations = await this.browserService.generateRecommendations(
          {
            ...params,
            businessId,
            businessName,
            businessType
          },
          params.reviews,
          businessType
        );
      }
      
      // Add enhanced analysis to the recommendations if available
      if (enhancedAnalysis) {
        recommendations.enhancedAnalysis = enhancedAnalysis;
      }
      
      // Add business info to recommendations
      recommendations.businessId = businessId;
      recommendations.businessName = businessName;
      
      // Save the recommendations to the database if we have a business ID
      if (businessId) {
        await saveRecommendation(businessId, recommendations);
      } else {
        console.warn('Could not save recommendations - no business ID available');
      }
      
      // Reset circuit breaker on success
      if (this.circuitState === CircuitState.HALF_OPEN) {
        this.circuitState = CircuitState.CLOSED;
        this.failureCount = 0;
      }
      
      return recommendations;
    } catch (error) {
      // Increment failure counter
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // If failure threshold met, open the circuit
      if (this.failureCount >= this.failureThreshold) {
        this.circuitState = CircuitState.OPEN;
        console.error('Circuit breaker opened due to multiple failures', error);
      }
      
      console.error('Primary AI failed, attempting fallback', error);
      toast({
        title: 'AI Processing Warning',
        description: error instanceof Error ? error.message : 'An error occurred during AI processing, attempting fallback method.',
        variant: 'warning'
      });
      
      // Fallback to browser AI if API fails
      if (this.provider === 'api') {
        try {
          // Extract business information
          let businessId: string;
          let businessName: string;
          let businessType: BusinessType;
          
          if (typeof params.business === 'string') {
            // If business is a string (name), get the business ID and type
            businessName = params.business;
            businessId = getBusinessIdFromName(params.reviews, businessName) || '';
            businessType = params.businessType || getBusinessTypeFromName(businessName);
          } else {
            // If business is an object, extract properties
            businessId = params.business.id;
            businessName = params.business.name;
            businessType = params.businessType || params.business.business_type as BusinessType || BusinessType.OTHER;
          }
          
          const recommendations = await this.browserService.generateRecommendations(
            {
              ...params,
              businessId,
              businessName,
              businessType
            },
            params.reviews,
            businessType
          );
          
          // Add business info to recommendations
          recommendations.businessId = businessId;
          recommendations.businessName = businessName;
          
          // Save the recommendations to the database if we have a business ID
          if (businessId) {
            await saveRecommendation(businessId, recommendations);
          }
          
          return recommendations;
        } catch (fallbackError) {
          console.error('Fallback to browser AI also failed', fallbackError);
          toast({
            title: 'AI Processing Failed',
            description: 'Both primary and fallback AI processing methods failed. Please try again later.',
            variant: 'destructive'
          });
          throw new Error(`AI processing failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }
      
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async generateApiRecommendations(params: any): Promise<Recommendations> {
    // Get the API provider and key with additional validation
    const apiProvider = localStorage.getItem('AI_PROVIDER') as AIProviderType || 'openai';
    const apiKey = localStorage.getItem(`${apiProvider.toUpperCase()}_API_KEY`);
    
    if (!apiKey) {
      toast({
        title: 'API Configuration Error',
        description: `No API key found for ${apiProvider}. Please configure your API key in the settings.`,
        variant: 'destructive'
      });
      throw new Error(`No API key found for ${apiProvider}`);
    }
    
    const { businessId, businessName, businessType } = params;
    
    try {
      // Call the edge function with the new parameters
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          businessId,
          analysisData: {
            businessName,
            businessType,
            reviews: params.reviews || [],
            metrics: params.metrics || {},
            patterns: params.patterns || {},
            sentiment: params.sentiment || {}
          },
          businessType,
          provider: apiProvider,
          apiKey
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      return data as Recommendations;
    } catch (error) {
      console.error('Failed to generate API recommendations', error);
      
      // Create AI provider as fallback
      const aiService = AIServiceFactory.createProvider({
        provider: apiProvider,
        apiKey,
        ...defaultConfigs[apiProvider]
      });
      
      // Convert analysis data to business context
      const businessContext: BusinessContext = {
        businessName,
        businessType,
        reviews: params.reviews || [],
        metrics: params.metrics || {},
        analysis: await this.convertToReviewAnalysis(params),
        historicalTrends: params.patterns || {}
      };
      
      // Generate recommendations using the AI provider
      const recommendations = await aiService.generateRecommendations(businessContext);
      
      // Add business info to recommendations
      recommendations.businessId = businessId;
      recommendations.businessName = businessName;
      
      // Generate additional components if not provided
      if (!recommendations.customerAttractionPlan) {
        try {
          recommendations.customerAttractionPlan = await aiService.generateMarketingPlan(businessContext);
        } catch (error) {
          console.error('Failed to generate marketing plan', error);
          recommendations.customerAttractionPlan = {
            title: 'Marketing Plan Generation Failed',
            description: 'Unable to generate marketing plan at this time.',
            strategies: []
          };
        }
      }
      
      if (!recommendations.scenarios || recommendations.scenarios.length === 0) {
        try {
          recommendations.scenarios = await aiService.generateScenarios(businessContext);
        } catch (error) {
          console.error('Failed to generate scenarios', error);
          recommendations.scenarios = [];
        }
      }
      
      return recommendations;
    }
  }
  
  private async convertToReviewAnalysis(params: any): Promise<ReviewAnalysis> {
    // Convert the existing analysis format to the new ReviewAnalysis format
    // with defensive programming to handle potential undefined values
    const sentiment = params.sentimentAnalysis || [];
    const totalSentiment = sentiment.reduce((sum: number, s: any) => sum + (s?.value || 0), 0) || 1;
    
    const findSentiment = (name: string) => {
      const found = sentiment.find((s: any) => s?.name === name);
      return found?.value || 0;
    };
    
    return {
      sentiment: {
        overall: findSentiment('Positive') / totalSentiment || 0.5,
        breakdown: {
          positive: findSentiment('Positive'),
          neutral: findSentiment('Neutral'),
          negative: findSentiment('Negative')
        }
      },
      themes: (params.commonTerms || []).map((term: any) => ({
        name: term?.text || 'Unknown',
        frequency: term?.count || 0,
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
  
  // Reset the circuit breaker (for testing/debugging)
  resetCircuitBreaker(): void {
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
  
  // Check circuit breaker status
  getCircuitStatus(): { state: string, failureCount: number, canRetryIn: number } {
    const now = Date.now();
    const canRetryIn = this.circuitState === CircuitState.OPEN 
      ? Math.max(0, Math.ceil((this.resetTimeout - (now - this.lastFailureTime)) / 1000))
      : 0;
      
    return {
      state: CircuitState[this.circuitState],
      failureCount: this.failureCount,
      canRetryIn
    };
  }
}

// Singleton instance with error handling
let recommendationService: RecommendationService | null = null;

export function getRecommendationService(provider?: AIProvider): RecommendationService {
  try {
    if (!recommendationService) {
      recommendationService = new RecommendationService(provider);
    } else if (provider && recommendationService.getCurrentProvider() !== provider) {
      recommendationService.setProvider(provider);
    }
    
    return recommendationService;
  } catch (error) {
    console.error('Failed to initialize recommendation service', error);
    toast({
      title: 'Service Initialization Error',
      description: 'Failed to initialize the AI recommendation service. Please refresh the page and try again.',
      variant: 'destructive'
    });
    // Return a new instance as fallback
    return new RecommendationService('browser');
  }
}
