import { 
  Recommendations, 
  BusinessHealth,
  UrgentAction,
  GrowthStrategy,
  PatternInsight,
  CompetitiveAnalysis,
  MarketingPlan,
  BusinessScenario,
  Strategy
} from '@/types/recommendations';
import { BusinessType, industryBenchmarks } from '@/types/businessTypes';
import { Review } from '@/types/reviews';

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
  private worker: Worker | null = null;
  private workerPromises: Map<string, { resolve: Function, reject: Function }> = new Map();
  private retryLimit = 3;
  private retryCount = 0;
  private isWorkerReady = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create a new worker or reset if it exists
      if (this.worker) {
        this.terminateWorker();
      }
      
      // Create a new Web Worker
      this.worker = new Worker(new URL('./ai-worker.js', import.meta.url));
      
      // Set up message handling
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      this.isWorkerReady = true;
      console.log('AI Worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Worker:', error);
      this.isWorkerReady = false;
    }
  }

  private terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject any pending promises
    this.workerPromises.forEach((promise) => {
      promise.reject(new Error('Worker terminated'));
    });
    
    // Clear the promises map
    this.workerPromises.clear();
  }

  private handleWorkerMessage(event: MessageEvent) {
    // Find the corresponding promise resolver
    const requestId = 'default'; // Use a better ID system in a real implementation
    const promise = this.workerPromises.get(requestId);
    
    if (promise) {
      // Resolve the promise with the data
      const { resolve } = promise;
      this.workerPromises.delete(requestId);
      
      // Reset retry count on success
      this.retryCount = 0;
      
      // Check if there's an error in the response
      if (event.data && event.data.error) {
        resolve(this.getFallbackRecommendations(event.data.error));
      } else {
        resolve(event.data);
      }
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('AI Worker error:', error);
    
    // Find the corresponding promise rejection
    const requestId = 'default'; // Use a better ID system in a real implementation
    const promise = this.workerPromises.get(requestId);
    
    if (promise) {
      const { reject } = promise;
      this.workerPromises.delete(requestId);
      
      // Try to restart the worker if not beyond retry limit
      if (this.retryCount < this.retryLimit) {
        this.retryCount++;
        console.log(`Retrying AI Worker (${this.retryCount}/${this.retryLimit})`);
        this.initWorker();
        reject(new Error(`Worker error, retrying (${this.retryCount}/${this.retryLimit}): ${error.message}`));
      } else {
        // Return fallback recommendations if beyond retry limit
        reject(new Error(`AI Worker failed after ${this.retryLimit} retries: ${error.message}`));
      }
    }
  }

  // Core recommendation generation using the Web Worker
  async generateRecommendations(
    analysisData: AnalysisResult,
    reviews: Review[],
    businessType: BusinessType = BusinessType.OTHER
  ): Promise<Recommendations> {
    // Check if we need fallback mode
    if (!this.isWorkerReady || !this.worker) {
      console.warn('AI Worker not available, using fallback mode');
      return this.getFallbackRecommendations();
    }
    
    try {
      // Create a promise that will be resolved when the worker responds
      const requestPromise = new Promise<Recommendations>((resolve, reject) => {
        const requestId = 'default'; // Use a better ID system in a real implementation
        this.workerPromises.set(requestId, { resolve, reject });
        
        // Add a timeout to prevent infinite waiting
        const timeoutId = setTimeout(() => {
          if (this.workerPromises.has(requestId)) {
            this.workerPromises.delete(requestId);
            reject(new Error('Worker response timeout after 30 seconds'));
          }
        }, 30000);
        
        // Send the data to the worker
        this.worker!.postMessage({
          analysisData,
          reviews,
          businessType
        });
      });
      
      // Wait for the worker to respond
      const result = await requestPromise;
      return result;
    } catch (error) {
      console.error('Error in worker communication:', error);
      
      // If we've exceeded retry limit, use fallback
      if (this.retryCount >= this.retryLimit) {
        return this.getFallbackRecommendations(error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Try again with a new worker
      this.retryCount++;
      console.log(`Retrying recommendation generation (${this.retryCount}/${this.retryLimit})`);
      this.initWorker();
      
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.generateRecommendations(analysisData, reviews, businessType);
    }
  }

  // Fallback recommendations for when the worker fails
  private getFallbackRecommendations(errorMessage?: string): Recommendations {
    return {
      businessId: '',
      businessName: 'Fallback Analysis',
      urgentActions: [
        {
          id: 'fallback-1',
          title: 'AI Processing Issue',
          description: errorMessage || 'There was an issue processing the analysis. Using simplified recommendations.',
          category: 'warning',
          relatedReviews: [],
          suggestedAction: 'Try again or check console for errors',
          timeframe: 'Immediate'
        }
      ],
      growthStrategies: [
        {
          id: 'fallback-growth-1',
          title: 'Review Collection Campaign',
          description: 'Increase review volume to improve analysis quality',
          category: 'marketing',
          expectedImpact: 'Improved customer insights',
          implementation: ['Create post-visit review requests', 'Train staff to request reviews'],
          timeframe: '1 month',
          kpis: ['Review count', 'Customer feedback quality']
        }
      ],
      patternInsights: [
        {
          id: 'fallback-pattern-1',
          pattern: 'Basic analysis only',
          frequency: 100,
          sentiment: 'neutral',
          recommendation: 'Try again for detailed analysis',
          examples: []
        }
      ],
      competitivePosition: {
        position: 'unknown',
        metrics: {
          rating: { value: 0, benchmark: 0, percentile: 50 },
          reviewVolume: { value: 0, benchmark: 0, percentile: 50 },
          sentiment: { value: 0, benchmark: 0, percentile: 50 }
        },
        strengths: ['Unable to determine in fallback mode'],
        weaknesses: ['Unable to determine in fallback mode'],
        opportunities: ['Run full analysis when system is available']
      },
      customerAttractionPlan: {
        targetAudiences: {
          primary: ['Current customers'],
          secondary: ['Potential customers'],
          untapped: ['Based on your business type']
        },
        channels: [
          {
            name: 'Social Media',
            strategy: 'Regular posting of business updates',
            budget: 'low'
          }
        ],
        messaging: {
          keyPoints: ['quality', 'service', 'value'],
          uniqueValue: 'Your unique business proposition',
          callToAction: 'Visit us today!'
        }
      },
      scenarios: [
        {
          name: 'Basic Scenario',
          description: 'Limited analysis available',
          probability: 1,
          timeframe: '3 months',
          projectedMetrics: {
            reviewVolume: 0,
            avgRating: 0,
            sentiment: 0,
            revenue: 'unknown'
          },
          requiredActions: ['Run complete analysis when available']
        }
      ],
      longTermStrategies: [
        {
          id: 'fallback-long-1',
          category: 'general',
          title: 'Basic Business Strategy',
          description: 'Focus on core business operations',
          timeframe: '6 months',
          actions: ['Maintain quality', 'Listen to customer feedback'],
          expectedROI: 'Varies',
          riskLevel: 'low'
        }
      ]
    };
  }
}
