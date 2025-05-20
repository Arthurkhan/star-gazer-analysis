import { 
  AIConfig, 
  ReviewAnalysis, 
  BusinessContext, 
  AIResponse,
  BusinessTypePrompts 
} from '@/types/aiService';
import { Recommendations } from '@/types/recommendations';
import { Review } from '@/types/reviews';

export interface AIProvider {
  name: string;
  config: AIConfig;
  
  // Core methods
  analyzeReviews(reviews: Review[], businessType: string): Promise<ReviewAnalysis>;
  generateRecommendations(context: BusinessContext): Promise<Recommendations>;
  generateMarketingPlan(context: BusinessContext): Promise<any>;
  
  // Utility methods
  testConnection(): Promise<boolean>;
  estimateTokens(text: string): number;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  protected config: AIConfig;
  
  constructor(config: AIConfig) {
    this.config = config;
  }
  
  abstract analyzeReviews(reviews: Review[], businessType: string): Promise<ReviewAnalysis>;
  abstract generateRecommendations(context: BusinessContext): Promise<Recommendations>;
  abstract generateMarketingPlan(context: BusinessContext): Promise<any>;
  abstract testConnection(): Promise<boolean>;
  
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  protected buildPrompt(template: string, variables: Record<string, any>): string {
    let prompt = template;
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return prompt;
  }
}
