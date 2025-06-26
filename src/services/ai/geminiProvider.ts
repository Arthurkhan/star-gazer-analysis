import { BaseAIProvider } from './baseAIProvider'
import type { AIConfig, ReviewAnalysis, BusinessContext } from '@/types/aiService'
import type { Recommendations } from '@/types/recommendations'
import type { Review } from '@/types/reviews'
import { getPromptsForBusinessType } from './prompts/businessPrompts'
import type { BusinessType } from '@/types/businessTypes'

export class GeminiProvider extends BaseAIProvider {
  name = 'Gemini'

  constructor(config: AIConfig) {
    super(config)
  }

  async analyzeReviews(reviews: Review[], businessType: string): Promise<ReviewAnalysis> {
    try {
      const prompts = getPromptsForBusinessType(businessType as BusinessType)
      const reviewTexts = reviews.map(r => `Rating: ${r.stars}/5 - ${r.text}`).join('\n\n')

      const response = await this.callGemini({
        contents: [{
          parts: [{
            text: `${prompts.analysis.system}\n\n${this.buildPrompt(prompts.analysis.user, { reviews: reviewTexts })}`,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      })

      return this.parseAnalysisResponse(response)
    } catch (error) {
      console.error('Gemini analysis error:', error)
      throw new Error('Failed to analyze reviews with Gemini')
    }
  }

  async generateRecommendations(context: BusinessContext): Promise<Recommendations> {
    try {
      const prompts = getPromptsForBusinessType(context.businessType as BusinessType)

      const response = await this.callGemini({
        contents: [{
          parts: [{
            text: `${prompts.recommendations.system}\n\n${this.buildPrompt(prompts.recommendations.user, {
              businessName: context.businessName,
              analysis: JSON.stringify(context.analysis),
              metrics: JSON.stringify(context.metrics),
            })}`,
          }],
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 3000,
        },
      })

      return this.parseRecommendationsResponse(response)
    } catch (error) {
      console.error('Gemini recommendations error:', error)
      throw new Error('Failed to generate recommendations with Gemini')
    }
  }

  async generateMarketingPlan(context: BusinessContext): Promise<any> {
    // Similar implementation to generateRecommendations
    return {}
  }

  async generateScenarios(context: BusinessContext): Promise<any> {
    // Similar implementation to generateRecommendations
    return {}
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return response.ok
    } catch (error) {
      console.error('Gemini connection test failed:', error)
      return false
    }
  }

  private async callGemini(params: any): Promise<any> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || 'gemini-pro'}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  private parseAnalysisResponse(response: string): ReviewAnalysis {
    try {
      return JSON.parse(response)
    } catch {
      // Implement structured extraction from natural language response
      return {} as ReviewAnalysis
    }
  }

  private parseRecommendationsResponse(response: string): Recommendations {
    try {
      return JSON.parse(response)
    } catch {
      // Implement structured extraction from natural language response
      return {} as Recommendations
    }
  }
}
