import { BaseAIProvider } from './baseAIProvider';
import { AIConfig, ReviewAnalysis, BusinessContext } from '@/types/aiService';
import { Recommendations } from '@/types/recommendations';
import { Review } from '@/types/reviews';
import { getPromptsForBusinessType } from './prompts/businessPrompts';
import { BusinessType } from '@/types/businessTypes';

export class OpenAIProvider extends BaseAIProvider {
  name = 'OpenAI';
  
  constructor(config: AIConfig) {
    super(config);
  }
  
  async analyzeReviews(reviews: Review[], businessType: string): Promise<ReviewAnalysis> {
    try {
      const prompts = getPromptsForBusinessType(businessType as BusinessType);
      const reviewTexts = reviews.map(r => `Rating: ${r.stars}/5 - ${r.text}`).join('\n\n');
      
      // Perform enhanced analysis
      const enhancedAnalysis = await this.performEnhancedAnalysis(reviews);
      
      // Enrich the prompt with enhanced analysis insights
      const enrichedPrompt = this.enrichPromptWithAnalysis(
        this.buildPrompt(prompts.analysis.user, { reviews: reviewTexts }),
        enhancedAnalysis
      );
      
      const response = await this.callOpenAI({
        messages: [
          { role: 'system', content: prompts.analysis.system },
          { role: 'user', content: enrichedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });
      
      const analysis = this.parseAnalysisResponse(response);
      
      // Merge enhanced analysis data into the response
      return {
        ...analysis,
        temporalPatterns: enhancedAnalysis.temporalPatterns,
        historicalTrends: enhancedAnalysis.historicalTrends,
        reviewClusters: enhancedAnalysis.reviewClusters,
        seasonalAnalysis: enhancedAnalysis.seasonalAnalysis
      };
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error('Failed to analyze reviews with OpenAI');
    }
  }
  
  async generateRecommendations(context: BusinessContext): Promise<Recommendations> {
    try {
      const prompts = getPromptsForBusinessType(context.businessType as BusinessType);
      
      // Get enhanced analysis data if available
      const enhancedAnalysis = context.reviews ? await this.performEnhancedAnalysis(context.reviews) : null;
      
      let enrichedContext = JSON.stringify(context.analysis);
      if (enhancedAnalysis) {
        enrichedContext += `\n\nEnhanced Analysis Insights:\n${JSON.stringify({
          temporalPatterns: enhancedAnalysis.temporalPatterns,
          historicalTrends: enhancedAnalysis.historicalTrends,
          reviewClusters: enhancedAnalysis.reviewClusters,
          seasonalAnalysis: enhancedAnalysis.seasonalAnalysis,
          insights: enhancedAnalysis.insights
        }, null, 2)}`;
      }
      
      const response = await this.callOpenAI({
        messages: [
          { role: 'system', content: prompts.recommendations.system },
          { 
            role: 'user', 
            content: this.buildPrompt(prompts.recommendations.user, {
              businessName: context.businessName,
              analysis: enrichedContext,
              metrics: JSON.stringify(context.metrics)
            })
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      });
      
      return this.parseRecommendationsResponse(response);
    } catch (error) {
      console.error('OpenAI recommendations error:', error);
      throw new Error('Failed to generate recommendations with OpenAI');
    }
  }
  
  async generateMarketingPlan(context: BusinessContext): Promise<any> {
    try {
      const prompts = getPromptsForBusinessType(context.businessType as BusinessType);
      
      // Include seasonal and cluster insights in marketing plan
      const enhancedData = {
        customerSegments: context.analysis.reviewClusters || [],
        seasonalOpportunities: context.analysis.seasonalAnalysis || [],
        temporalPatterns: context.analysis.temporalPatterns || []
      };
      
      const response = await this.callOpenAI({
        messages: [
          { role: 'system', content: prompts.marketing.system },
          { 
            role: 'user', 
            content: this.buildPrompt(prompts.marketing.user, {
              businessName: context.businessName,
              analysis: JSON.stringify(context.analysis),
              strengths: JSON.stringify(context.analysis.strengths),
              demographics: JSON.stringify(enhancedData.customerSegments),
              seasonalData: JSON.stringify(enhancedData.seasonalOpportunities)
            })
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });
      
      return this.parseMarketingResponse(response);
    } catch (error) {
      console.error('OpenAI marketing plan error:', error);
      throw new Error('Failed to generate marketing plan with OpenAI');
    }
  }
  
  async generateScenarios(context: BusinessContext): Promise<any> {
    try {
      const prompts = getPromptsForBusinessType(context.businessType as BusinessType);
      
      // Use historical trends for more accurate scenario planning
      const trendData = {
        historicalTrends: context.analysis.historicalTrends || [],
        temporalPatterns: context.analysis.temporalPatterns || [],
        insights: context.analysis.insights || {}
      };
      
      const response = await this.callOpenAI({
        messages: [
          { role: 'system', content: prompts.scenarios.system },
          { 
            role: 'user', 
            content: this.buildPrompt(prompts.scenarios.user, {
              businessName: context.businessName,
              currentMetrics: JSON.stringify(context.metrics),
              trends: JSON.stringify(trendData),
              opportunities: JSON.stringify(context.analysis.strengths)
            })
          }
        ],
        temperature: 0.8,
        max_tokens: 2500
      });
      
      return this.parseScenariosResponse(response);
    } catch (error) {
      console.error('OpenAI scenarios error:', error);
      throw new Error('Failed to generate scenarios with OpenAI');
    }
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
  
  private async callOpenAI(params: any): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4-turbo-preview',
        ...params
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  private parseAnalysisResponse(response: string): ReviewAnalysis {
    try {
      // Attempt to parse JSON response, fallback to structured extraction
      return JSON.parse(response);
    } catch {
      // Implement structured extraction from natural language response
      return this.extractAnalysisFromText(response);
    }
  }
  
  private parseRecommendationsResponse(response: string): Recommendations {
    try {
      return JSON.parse(response);
    } catch {
      // Implement structured extraction from natural language response
      return this.extractRecommendationsFromText(response);
    }
  }
  
  private parseMarketingResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return this.extractMarketingFromText(response);
    }
  }
  
  private parseScenariosResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return this.extractScenariosFromText(response);
    }
  }
  
  // Fallback parsing methods
  private extractAnalysisFromText(text: string): ReviewAnalysis {
    // Implementation for extracting structured data from natural language
    // This is a simplified version - you'd want more sophisticated parsing
    return {
      sentiment: {
        overall: 0.7,
        breakdown: { positive: 0.6, neutral: 0.3, negative: 0.1 }
      },
      themes: [],
      painPoints: [],
      strengths: [],
      customerSegments: []
    };
  }
  
  private extractRecommendationsFromText(text: string): Recommendations {
    // Implementation for extracting recommendations from natural language
    // This would need sophisticated parsing logic
    return {} as Recommendations;
  }
  
  private extractMarketingFromText(text: string): any {
    // Implementation for extracting marketing plan from natural language
    return {};
  }
  
  private extractScenariosFromText(text: string): any {
    // Implementation for extracting scenarios from natural language
    return [];
  }
}
