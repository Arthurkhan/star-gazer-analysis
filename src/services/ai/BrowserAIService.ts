import { Logger } from '@/utils/logger';
import { BusinessType } from '@/types/businessTypes';
import { Recommendations } from '@/types/recommendations';
import { Review } from '@/types/reviews';
import aiWorker from './aiWorker';
import { toast } from '@/hooks/use-toast';

/**
 * Browser-based AI service that uses web workers for processing
 * This is the primary implementation for browser-based AI analysis
 */
export class BrowserAIService {
  private logger = new Logger('BrowserAIService');
  private processingTimeout = 60000; // 60 seconds timeout

  constructor() {
    this.logger.log('BrowserAIService initialized');
  }

  /**
   * Generate recommendations using browser-based processing in a web worker
   */
  async generateRecommendations(
    params: any,
    reviews: Review[],
    businessType: BusinessType
  ): Promise<Recommendations> {
    try {
      this.logger.log(`Generating recommendations for ${params.businessName} using browser AI`);

      // First, analyze the reviews using the web worker
      const analysisResult = await this.analyzeReviewsWithWorker(reviews);
      
      if (!analysisResult) {
        throw new Error('Review analysis failed');
      }

      this.logger.log('Review analysis completed, generating recommendations');

      // Use the worker to generate recommendations based on the analysis
      const result = await aiWorker.executeTask('generateSimpleRecommendations', {
        businessName: params.businessName,
        businessType,
        reviews,
        analysis: analysisResult
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate recommendations');
      }

      this.logger.log('Browser AI generated recommendations successfully');
      
      // Process and return the recommendations
      const recommendations: Recommendations = {
        businessName: params.businessName,
        businessId: params.businessId,
        urgentActions: result.recommendations?.urgentActions || [],
        growthStrategies: result.recommendations?.growthStrategies || [],
        customerAttractionPlan: result.recommendations?.customerAttractionPlan || {
          title: 'Customer Attraction Plan',
          description: 'Strategies to attract and retain customers',
          strategies: []
        },
        competitivePositioning: result.recommendations?.competitivePositioning || {
          title: 'Competitive Positioning',
          description: 'Analysis of market position',
          strengths: [],
          opportunities: [],
          recommendations: []
        },
        futureProjections: result.recommendations?.futureProjections || {
          shortTerm: [],
          longTerm: []
        }
      };

      return recommendations;
    } catch (error) {
      this.logger.error('Error generating browser AI recommendations:', error);
      toast({
        title: 'AI Processing Error',
        description: error instanceof Error ? error.message : 'Failed to generate recommendations',
        variant: 'destructive'
      });
      throw new Error(`Browser AI failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze reviews using the web worker
   */
  private async analyzeReviewsWithWorker(reviews: Review[]) {
    try {
      this.logger.log(`Analyzing ${reviews.length} reviews with web worker`);
      
      // Use the worker to analyze the reviews
      const result = await aiWorker.executeTask('analyze', reviews);
      
      if (!result) {
        throw new Error('Worker returned no analysis result');
      }
      
      this.logger.log('Review analysis completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error analyzing reviews with worker:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
