import { 
  AIConfig, 
  ReviewAnalysis, 
  BusinessContext, 
  AIResponse,
  BusinessTypePrompts 
} from '@/types/aiService';
import { Recommendations } from '@/types/recommendations';
import { Review } from '@/types/reviews';
import { EnhancedAnalysis } from '@/types/dataAnalysis';
import { enhancedDataAnalysisService } from '@/services/dataAnalysis/enhancedDataAnalysisService';

export interface AIProvider {
  name: string;
  config: AIConfig;
  
  // Core methods
  analyzeReviews(reviews: Review[], businessType: string): Promise<ReviewAnalysis>;
  generateRecommendations(context: BusinessContext): Promise<Recommendations>;
  generateMarketingPlan(context: BusinessContext): Promise<any>;
  generateScenarios(context: BusinessContext): Promise<any>;
  
  // Enhanced analysis methods
  performEnhancedAnalysis(reviews: Review[]): Promise<EnhancedAnalysis>;
  
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
  abstract generateScenarios(context: BusinessContext): Promise<any>;
  abstract testConnection(): Promise<boolean>;
  
  // Enhanced analysis implementation
  async performEnhancedAnalysis(reviews: Review[]): Promise<EnhancedAnalysis> {
    // Use the enhanced data analysis service
    return enhancedDataAnalysisService.analyzeData(reviews);
  }
  
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
  
  // Helper method to incorporate enhanced analysis into prompts
  protected enrichPromptWithAnalysis(
    basePrompt: string, 
    enhancedAnalysis: EnhancedAnalysis
  ): string {
    const insights = `
    Temporal Patterns:
    ${enhancedAnalysis.temporalPatterns.map(p => `- ${p.description} (confidence: ${p.strength})`).join('\n')}
    
    Historical Trends:
    ${enhancedAnalysis.historicalTrends.map(t => `- ${t.metric}: ${t.trend} trend`).join('\n')}
    
    Customer Segments:
    ${enhancedAnalysis.reviewClusters.map(c => `- ${c.name}: ${c.reviewCount} reviews, ${c.averageRating.toFixed(1)} avg rating`).join('\n')}
    
    Seasonal Patterns:
    ${enhancedAnalysis.seasonalAnalysis.map(s => `- ${s.name}: ${s.metrics.avgRating.toFixed(1)} avg rating, ${s.comparison.vsYearAverage.toFixed(1)}% vs year average`).join('\n')}
    
    Key Insights:
    ${enhancedAnalysis.insights.keyFindings.join('\n')}
    `;
    
    return `${basePrompt}\n\nAdditional Analysis:\n${insights}`;
  }
}
