// src/services/ai/aiWorker.ts
// AI processing worker implementation to prevent main thread blocking

import { WorkerManager, createWorkerScript } from '@/utils/worker/workerManager';
import { appDebugger } from '@/utils/debugger';
import { handleError, ErrorSeverity } from '@/utils/errorHandling';
import { Review } from '@/types/reviews';
import { BusinessType, Recommendations } from '@/types/recommendations';

// Types for AI tasks
export interface SentimentAnalysisTask {
  text: string;
}

export interface ReviewAnalysisTask {
  reviews: Review[];
}

export interface RecommendationGenerationTask {
  reviews: Review[];
  businessType: BusinessType;
  metrics: any;
  businessId: string;
  businessName: string;
}

// Define worker functions for AI tasks
const aiWorkerTasks = {
  // Sentiment analysis task
  analyzeSentiment: async (data: SentimentAnalysisTask) => {
    // This would normally use a library like sentiment.js or a custom implementation
    // We're simulating the analysis here
    try {
      const { text } = data;
      const words = text.split(/\s+/);
      
      // Simple dictionary-based approach for demonstration
      const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'best', 'fantastic'];
      const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'hate', 'awful', 'disappointing', 'horrible'];
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      words.forEach(word => {
        const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
        
        if (positiveWords.includes(lowerWord)) {
          positiveScore++;
        } else if (negativeWords.includes(lowerWord)) {
          negativeScore++;
        }
      });
      
      const total = words.length || 1;
      const normalizedPositive = positiveScore / total;
      const normalizedNegative = negativeScore / total;
      const normalizedNeutral = 1 - normalizedPositive - normalizedNegative;
      
      return {
        positive: normalizedPositive,
        negative: normalizedNegative,
        neutral: normalizedNeutral,
        compound: normalizedPositive - normalizedNegative
      };
    } catch (error) {
      console.error('Error in sentiment analysis worker:', error);
      throw error;
    }
  },
  
  // Batch sentiment analysis for multiple reviews
  analyzeBatchSentiment: async (data: ReviewAnalysisTask) => {
    try {
      const { reviews } = data;
      const results = [];
      
      for (const review of reviews) {
        if (!review.text) continue;
        
        const sentiment = await aiWorkerTasks.analyzeSentiment({ text: review.text });
        results.push({
          review,
          sentiment
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch sentiment analysis worker:', error);
      throw error;
    }
  },
  
  // Extract common terms from reviews
  extractCommonTerms: async (data: ReviewAnalysisTask) => {
    try {
      const { reviews } = data;
      const termCounts = new Map<string, number>();
      
      // Process each review
      for (const review of reviews) {
        if (!review.text) continue;
        
        // Tokenize and count terms
        const words = review.text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3); // Ignore short words
        
        // Count word frequencies
        for (const word of words) {
          termCounts.set(word, (termCounts.get(word) || 0) + 1);
        }
      }
      
      // Convert to array and sort
      const termArray = Array.from(termCounts.entries())
        .map(([term, count]) => ({ term, count }))
        .filter(item => item.count > 1) // Only terms mentioned multiple times
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 terms
      
      return termArray;
    } catch (error) {
      console.error('Error in term extraction worker:', error);
      throw error;
    }
  },
  
  // Generate simple recommendations based on review analysis
  generateSimpleRecommendations: async (data: RecommendationGenerationTask) => {
    try {
      const { reviews, businessType, metrics, businessId, businessName } = data;
      
      // Analyze sentiment
      const sentimentResults = await aiWorkerTasks.analyzeBatchSentiment({ reviews });
      const averageSentiment = sentimentResults.reduce((sum, item) => sum + item.sentiment.compound, 0) / 
                                 (sentimentResults.length || 1);
      
      // Extract common terms
      const commonTerms = await aiWorkerTasks.extractCommonTerms({ reviews });
      
      // Generate recommendations based on business type and analysis
      let recommendations: Partial<Recommendations> = {
        businessId,
        businessName,
        lastUpdated: new Date().toISOString(),
        urgentActions: [],
        growthStrategies: [],
        customerAttractionPlan: {
          title: "Customer Attraction Plan",
          description: "Strategies to attract more customers based on your reviews.",
          strategies: []
        }
      };
      
      // Add urgent actions based on sentiment
      if (averageSentiment < -0.2) {
        recommendations.urgentActions!.push({
          title: "Address Negative Sentiment",
          description: "Your reviews show a concerning level of negative sentiment. Identify the common issues and address them immediately.",
          priority: "high",
          impact: "high",
          effort: "medium"
        });
      }
      
      // Add growth strategies based on business type
      if (businessType === 'CAFE') {
        recommendations.growthStrategies!.push({
          title: "Expand Menu Options",
          description: "Consider adding seasonal items to attract repeat customers and create buzz.",
          implementation: "Medium-term (1-3 months)",
          resources: ["Menu development", "Staff training", "Marketing materials"],
          expectedOutcome: "10-15% increase in repeat customers"
        });
      } else if (businessType === 'BAR') {
        recommendations.growthStrategies!.push({
          title: "Craft Cocktail Program",
          description: "Develop signature drinks that can't be found elsewhere to differentiate your bar.",
          implementation: "Short-term (2-4 weeks)",
          resources: ["Mixologist consultation", "Ingredient sourcing", "Menu printing"],
          expectedOutcome: "15-20% increase in beverage sales"
        });
      } else if (businessType === 'GALLERY') {
        recommendations.growthStrategies!.push({
          title: "Virtual Gallery Tours",
          description: "Create virtual tours to expand your reach beyond physical visitors.",
          implementation: "Medium-term (1-2 months)",
          resources: ["Photography services", "Web development", "Social media promotion"],
          expectedOutcome: "25% increase in digital engagement and 10% in physical visitors"
        });
      }
      
      // Add customer attraction ideas
      recommendations.customerAttractionPlan!.strategies.push({
        title: "Social Media Showcase",
        description: "Regularly share customer experiences and behind-the-scenes content.",
        channels: ["Instagram", "TikTok"],
        targetAudience: "25-40 year olds interested in unique experiences",
        expectedOutcome: "20% increase in social media followers and 5-10% in new customers"
      });
      
      return recommendations as Recommendations;
    } catch (error) {
      console.error('Error in recommendation generation worker:', error);
      throw error;
    }
  }
};

// Create the worker manager for AI tasks
let aiWorkerManager: WorkerManager | null = null;

/**
 * Initialize the AI worker manager
 */
export function initAIWorker(): Promise<void> {
  try {
    const workerScript = createWorkerScript(aiWorkerTasks);
    
    aiWorkerManager = WorkerManager.getInstance({
      workerScript,
      maxWorkers: 2,
      taskTimeout: 60000 // AI tasks can take longer
    });
    
    return aiWorkerManager.initialize();
  } catch (error) {
    handleError(error, {
      module: 'AIWorker',
      operation: 'initialize'
    }, ErrorSeverity.ERROR);
    throw error;
  }
}

/**
 * Get the AI worker manager instance
 */
export function getAIWorkerManager(): WorkerManager {
  if (!aiWorkerManager) {
    throw new Error('AI Worker Manager has not been initialized');
  }
  return aiWorkerManager;
}

/**
 * High-level API for sentiment analysis
 */
export async function analyzeSentiment(text: string): Promise<any> {
  try {
    if (!aiWorkerManager) {
      await initAIWorker();
    }
    
    return await getAIWorkerManager().executeTask('analyzeSentiment', { text });
  } catch (error) {
    handleError(error, {
      module: 'AIWorker',
      operation: 'analyzeSentiment'
    }, ErrorSeverity.ERROR);
    
    // Return a fallback result
    return {
      positive: 0.33,
      negative: 0.33,
      neutral: 0.34,
      compound: 0
    };
  }
}

/**
 * High-level API for batch sentiment analysis
 */
export async function analyzeBatchSentiment(reviews: Review[]): Promise<any[]> {
  try {
    if (!aiWorkerManager) {
      await initAIWorker();
    }
    
    appDebugger.info('Starting batch sentiment analysis', { reviewCount: reviews.length });
    const startTime = performance.now();
    
    const results = await getAIWorkerManager().executeTask('analyzeBatchSentiment', { reviews });
    
    const duration = Math.round(performance.now() - startTime);
    appDebugger.info('Completed batch sentiment analysis', { 
      reviewCount: reviews.length,
      duration,
      resultsCount: results.length
    });
    
    return results;
  } catch (error) {
    handleError(error, {
      module: 'AIWorker',
      operation: 'analyzeBatchSentiment'
    }, ErrorSeverity.ERROR);
    
    // Return an empty array as fallback
    return [];
  }
}

/**
 * High-level API for extracting common terms
 */
export async function extractCommonTerms(reviews: Review[]): Promise<any[]> {
  try {
    if (!aiWorkerManager) {
      await initAIWorker();
    }
    
    appDebugger.info('Starting term extraction', { reviewCount: reviews.length });
    
    return await getAIWorkerManager().executeTask('extractCommonTerms', { reviews });
  } catch (error) {
    handleError(error, {
      module: 'AIWorker',
      operation: 'extractCommonTerms'
    }, ErrorSeverity.ERROR);
    
    // Return an empty array as fallback
    return [];
  }
}

/**
 * High-level API for generating basic recommendations
 */
export async function generateBasicRecommendations(params: RecommendationGenerationTask): Promise<Recommendations> {
  try {
    if (!aiWorkerManager) {
      await initAIWorker();
    }
    
    appDebugger.info('Starting recommendation generation', { 
      businessName: params.businessName,
      businessType: params.businessType,
      reviewCount: params.reviews.length
    });
    
    const startTime = performance.now();
    
    const recommendations = await getAIWorkerManager().executeTask('generateSimpleRecommendations', params);
    
    const duration = Math.round(performance.now() - startTime);
    appDebugger.info('Completed recommendation generation', { 
      businessName: params.businessName,
      duration
    });
    
    return recommendations;
  } catch (error) {
    handleError(error, {
      module: 'AIWorker',
      operation: 'generateBasicRecommendations',
      data: {
        businessName: params.businessName,
        businessType: params.businessType
      }
    }, ErrorSeverity.ERROR);
    
    // Return a minimal fallback recommendation
    return {
      businessId: params.businessId,
      businessName: params.businessName,
      lastUpdated: new Date().toISOString(),
      urgentActions: [{
        title: "Recommendation Generation Failed",
        description: "We couldn't generate detailed recommendations. Please try again later.",
        priority: "medium",
        impact: "unknown",
        effort: "unknown"
      }],
      growthStrategies: [],
      customerAttractionPlan: {
        title: "Customer Attraction Plan",
        description: "Strategies to attract more customers based on your reviews.",
        strategies: []
      }
    };
  }
}

/**
 * Cleanup AI worker resources
 */
export function cleanupAIWorker(): void {
  if (aiWorkerManager) {
    aiWorkerManager.terminate();
    aiWorkerManager = null;
  }
}
