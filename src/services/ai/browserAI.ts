import { 
  Recommendations, 
  BusinessType 
} from '@/types/recommendations';
import { Review } from '@/types/reviews';
import { appDebugger } from '@/utils/debugger';
import { handleError, ErrorSeverity } from '@/utils/errorHandling';
import { 
  initAIWorker, 
  getAIWorkerManager, 
  cleanupAIWorker,
  generateBasicRecommendations,
  analyzeBatchSentiment,
  extractCommonTerms
} from './aiWorker';

interface AnalysisResult {
  sentimentAnalysis: { name: string; value: number }[];
  staffMentions: { name: string; count: number; sentiment: string }[];
  commonTerms: { text: string; count: number }[];
  mainThemes?: { theme: string; count: number; percentage: number }[];
  overallAnalysis: string;
  ratingBreakdown?: { rating: number; count: number; percentage: number }[];
  languageDistribution?: { language: string; count: number; percentage: number }[];
  businessId?: string;
  businessName?: string;
  businessType?: BusinessType;
}

export class BrowserAIService {
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private retryLimit = 3;
  private retryCount = 0;

  constructor() {
    this.initializeAI();
  }

  private async initializeAI(): Promise<void> {
    if (this.initialized) return;
    
    // Only initialize once
    if (!this.initializationPromise) {
      this.initializationPromise = new Promise<void>(async (resolve, reject) => {
        try {
          appDebugger.info('Initializing Browser AI Service');
          await initAIWorker();
          this.initialized = true;
          appDebugger.info('Browser AI Service initialized');
          resolve();
        } catch (error) {
          appDebugger.error('Failed to initialize Browser AI Service', error);
          this.initialized = false;
          reject(error);
        }
      });
    }
    
    return this.initializationPromise;
  }

  public async dispose(): Promise<void> {
    try {
      cleanupAIWorker();
      this.initialized = false;
      this.initializationPromise = null;
      appDebugger.info('Browser AI Service disposed');
    } catch (error) {
      handleError(error, {
        module: 'BrowserAIService',
        operation: 'dispose'
      }, ErrorSeverity.WARNING);
    }
  }

  // Core recommendation generation using the Worker system
  async generateRecommendations(
    analysisData: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType = BusinessType.OTHER
  ): Promise<Recommendations> {
    try {
      // Ensure AI is initialized
      await this.initializeAI();
      
      // Log the request
      appDebugger.info('Generating recommendations', {
        businessName: analysisData.businessName || 'Unknown business',
        businessType,
        reviewCount: reviews.length
      });
      
      // Process the reviews using the worker
      const payload = {
        businessId: analysisData.businessId || '',
        businessName: analysisData.businessName || 'Unknown business',
        businessType,
        reviews,
        metrics: {
          sentimentAnalysis: analysisData.sentimentAnalysis || [],
          staffMentions: analysisData.staffMentions || [],
          commonTerms: analysisData.commonTerms || [],
          mainThemes: analysisData.mainThemes || [],
          ratingBreakdown: analysisData.ratingBreakdown || []
        }
      };
      
      // Generate recommendations using the worker
      const recommendations = await generateBasicRecommendations(payload);
      
      // Reset retry count on success
      this.retryCount = 0;
      
      return recommendations;
    } catch (error) {
      appDebugger.error('Error generating recommendations', error);
      
      // If we've exceeded retry limit, use fallback
      if (this.retryCount >= this.retryLimit) {
        return this.getFallbackRecommendations(error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Try again with re-initialized worker
      this.retryCount++;
      appDebugger.warn(`Retrying recommendation generation (${this.retryCount}/${this.retryLimit})`);
      
      // Reinitialize the AI
      this.initialized = false;
      this.initializationPromise = null;
      await this.initializeAI();
      
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.generateRecommendations(analysisData, reviews, businessType);
    }
  }

  /**
   * Process reviews to generate sentiment analysis
   */
  async analyzeSentiment(reviews: Review[]): Promise<any[]> {
    try {
      // Ensure AI is initialized
      await this.initializeAI();
      
      // Use the worker to analyze sentiment
      return await analyzeBatchSentiment(reviews);
    } catch (error) {
      handleError(error, {
        module: 'BrowserAIService',
        operation: 'analyzeSentiment'
      }, ErrorSeverity.ERROR);
      
      // Return a fallback empty result
      return [];
    }
  }
  
  /**
   * Extract common terms from reviews
   */
  async getCommonTerms(reviews: Review[]): Promise<any[]> {
    try {
      // Ensure AI is initialized
      await this.initializeAI();
      
      // Use the worker to extract terms
      return await extractCommonTerms(reviews);
    } catch (error) {
      handleError(error, {
        module: 'BrowserAIService',
        operation: 'getCommonTerms'
      }, ErrorSeverity.ERROR);
      
      // Return a fallback empty result
      return [];
    }
  }

  // Fallback recommendations for when the worker fails
  private getFallbackRecommendations(errorMessage?: string): Recommendations {
    return {
      businessId: '',
      businessName: 'Fallback Analysis',
      lastUpdated: new Date().toISOString(),
      urgentActions: [
        {
          title: 'AI Processing Issue',
          description: errorMessage || 'There was an issue processing the analysis. Using simplified recommendations.',
          priority: 'high',
          impact: 'medium',
          effort: 'low'
        }
      ],
      growthStrategies: [
        {
          title: 'Review Collection Campaign',
          description: 'Increase review volume to improve analysis quality',
          implementation: 'Short-term (1-2 weeks)',
          resources: ['Staff training', 'Customer follow-up system'],
          expectedOutcome: 'Improved customer insights'
        }
      ],
      customerAttractionPlan: {
        title: 'Basic Customer Attraction Plan',
        description: 'Simple strategies to attract more customers',
        strategies: [
          {
            title: 'Social Media Engagement',
            description: 'Maintain active presence on social platforms',
            channels: ['Facebook', 'Instagram'],
            targetAudience: 'Local customers',
            expectedOutcome: 'Increased awareness'
          }
        ]
      }
    };
  }
}