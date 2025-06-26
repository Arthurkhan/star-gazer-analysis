import { BaseAIProvider } from './baseAIProvider'
import type { AIConfig, ReviewAnalysis, BusinessContext } from '@/types/aiService'
import type { Recommendations } from '@/types/recommendations'
import type { Review } from '@/types/reviews'
import { getPromptsForBusinessType } from './prompts/businessPrompts'
import type { BusinessType } from '@/types/businessTypes'

export class ClaudeProvider extends BaseAIProvider {
  name = 'Claude'

  constructor(config: AIConfig) {
    super(config)
  }

  async analyzeReviews(reviews: Review[], businessType: string): Promise<ReviewAnalysis> {
    try {
      const prompts = getPromptsForBusinessType(businessType as BusinessType)
      const reviewTexts = reviews.map(r => `Rating: ${r.stars}/5 - ${r.text}`).join('\n\n')

      const response = await this.callClaude({
        prompt: `${prompts.analysis.system}\n\n${this.buildPrompt(prompts.analysis.user, { reviews: reviewTexts })}`,
        max_tokens_to_sample: 2000,
        temperature: 0.7,
      })

      return this.parseAnalysisResponse(response)
    } catch (error) {
      console.error('Claude analysis error:', error)
      throw new Error('Failed to analyze reviews with Claude')
    }
  }

  async generateRecommendations(context: BusinessContext): Promise<Recommendations> {
    try {
      const prompts = getPromptsForBusinessType(context.businessType as BusinessType)

      const response = await this.callClaude({
        prompt: `${prompts.recommendations.system}\n\n${this.buildPrompt(prompts.recommendations.user, {
          businessName: context.businessName,
          analysis: JSON.stringify(context.analysis),
          metrics: JSON.stringify(context.metrics),
        })}`,
        max_tokens_to_sample: 3000,
        temperature: 0.8,
      })

      return this.parseRecommendationsResponse(response)
    } catch (error) {
      console.error('Claude recommendations error:', error)
      throw new Error('Failed to generate recommendations with Claude')
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
      // Claude API test endpoint
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Claude connection test failed:', error)
      return false
    }
  }

  private async callClaude(params: any): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: params.max_tokens_to_sample,
        temperature: params.temperature,
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
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
