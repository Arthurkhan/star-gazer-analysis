import type { Recommendations} from '@/types/recommendations'
import { AnalysisResult } from '@/types/recommendations'
import type { ReviewAnalysis } from '@/types/aiService'

export interface ParsedResponse {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

export class AIResponseParser {

  // Parse AI response with error recovery
  parseRecommendations(response: string | any): ParsedResponse {
    const warnings: string[] = []

    try {
      // If response is already an object, validate it
      if (typeof response === 'object' && response !== null) {
        return this.validateRecommendations(response)
      }

      // Try to parse JSON
      let data
      try {
        data = JSON.parse(response)
      } catch (jsonError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[1])
        } else {
          // Try to extract structured data from natural language
          return this.extractFromNaturalLanguage(response, 'recommendations')
        }
      }

      return this.validateRecommendations(data)

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse recommendations: ${error}`,
        warnings,
      }
    }
  }

  // Parse analysis response
  parseAnalysis(response: string | any): ParsedResponse {
    try {
      if (typeof response === 'object' && response !== null) {
        return this.validateAnalysis(response)
      }

      let data
      try {
        data = JSON.parse(response)
      } catch {
        // Extract from natural language or markdown
        const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[1])
        } else {
          return this.extractFromNaturalLanguage(response, 'analysis')
        }
      }

      return this.validateAnalysis(data)

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse analysis: ${error}`,
      }
    }
  }

  // Validate recommendations structure
  private validateRecommendations(data: any): ParsedResponse {
    const warnings: string[] = []
    const validated: Partial<Recommendations> = {}

    // Required fields with defaults
    const requiredFields = {
      urgentActions: [],
      growthStrategies: [],
      patternInsights: [],
      competitivePosition: this.getDefaultCompetitiveAnalysis(),
      customerAttractionPlan: this.getDefaultMarketingPlan(),
      scenarios: [],
      longTermStrategies: [],
    }

    // Copy valid fields
    Object.entries(requiredFields).forEach(([field, defaultValue]) => {
      if (data[field]) {
        validated[field as keyof Recommendations] = data[field]
      } else {
        validated[field as keyof Recommendations] = defaultValue
        warnings.push(`Missing field '${field}', using default value`)
      }
    })

    // Additional validation for specific fields
    if (validated.urgentActions && Array.isArray(validated.urgentActions)) {
      validated.urgentActions = validated.urgentActions.map((action, index) => ({
        id: action.id || `urgent-${index}`,
        title: action.title || 'Urgent Action',
        description: action.description || 'Action needed',
        category: action.category || 'important',
        ...action,
      }))
    }

    return {
      success: true,
      data: validated as Recommendations,
      warnings,
    }
  }

  // Validate analysis structure
  private validateAnalysis(data: any): ParsedResponse {
    const warnings: string[] = []
    const validated: Partial<ReviewAnalysis> = {}

    // Required fields
    if (!data.sentiment) {
      validated.sentiment = {
        overall: 0.5,
        breakdown: { positive: 0, neutral: 0, negative: 0 },
      }
      warnings.push('Missing sentiment data, using defaults')
    } else {
      validated.sentiment = data.sentiment
    }

    // Arrays with defaults
    validated.themes = data.themes || []
    validated.painPoints = data.painPoints || []
    validated.strengths = data.strengths || []
    validated.customerSegments = data.customerSegments || []

    // Optional fields
    if (data.temporalPatterns) validated.temporalPatterns = data.temporalPatterns
    if (data.clusters) validated.clusters = data.clusters

    return {
      success: true,
      data: validated as ReviewAnalysis,
      warnings,
    }
  }

  // Extract structured data from natural language
  private extractFromNaturalLanguage(text: string, type: string): ParsedResponse {
    const extractors = {
      recommendations: this.extractRecommendationsFromText.bind(this),
      analysis: this.extractAnalysisFromText.bind(this),
      marketing: this.extractMarketingFromText.bind(this),
      scenarios: this.extractScenariosFromText.bind(this),
    }

    const extractor = extractors[type as keyof typeof extractors]
    if (!extractor) {
      return {
        success: false,
        error: `Unknown extraction type: ${type}`,
      }
    }

    try {
      const data = extractor(text)
      return {
        success: true,
        data,
        warnings: ['Data extracted from natural language response'],
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract ${type} from text: ${error}`,
      }
    }
  }

  // Extract recommendations from text
  private extractRecommendationsFromText(text: string): Recommendations {
    const recommendations: Partial<Recommendations> = {
      urgentActions: [],
      growthStrategies: [],
      patternInsights: [],
      competitivePosition: this.getDefaultCompetitiveAnalysis(),
      customerAttractionPlan: this.getDefaultMarketingPlan(),
      scenarios: [],
      longTermStrategies: [],
    }

    // Look for urgent actions
    const urgentSection = text.match(/urgent|immediate|critical[\s\S]*?(?=\n\n|$)/gi)
    if (urgentSection) {
      recommendations.urgentActions = this.extractActionItems(urgentSection[0])
    }

    // Look for growth strategies
    const growthSection = text.match(/growth|strategy|strategies[\s\S]*?(?=\n\n|$)/gi)
    if (growthSection) {
      recommendations.growthStrategies = this.extractStrategies(growthSection[0])
    }

    // Look for patterns
    const patternSection = text.match(/pattern|trend|insight[\s\S]*?(?=\n\n|$)/gi)
    if (patternSection) {
      recommendations.patternInsights = this.extractPatterns(patternSection[0])
    }

    return recommendations as Recommendations
  }

  // Extract analysis from text
  private extractAnalysisFromText(text: string): ReviewAnalysis {
    const analysis: Partial<ReviewAnalysis> = {
      sentiment: {
        overall: 0.5,
        breakdown: { positive: 0, neutral: 0, negative: 0 },
      },
      themes: [],
      painPoints: [],
      strengths: [],
      customerSegments: [],
    }

    // Look for sentiment information
    const sentimentMatch = text.match(/(\d+)%?\s*positive|(\d+)%?\s*negative|(\d+)%?\s*neutral/gi)
    if (sentimentMatch) {
      sentimentMatch.forEach(match => {
        const [value, type] = match.split(/\s+/)
        const percentage = parseInt(value) / 100
        if (type.toLowerCase().includes('positive')) {
          analysis.sentiment!.breakdown.positive = percentage
        } else if (type.toLowerCase().includes('negative')) {
          analysis.sentiment!.breakdown.negative = percentage
        } else if (type.toLowerCase().includes('neutral')) {
          analysis.sentiment!.breakdown.neutral = percentage
        }
      })
    }

    // Look for themes
    const themeSection = text.match(/theme|topic|common[\s\S]*?(?=\n\n|$)/gi)
    if (themeSection) {
      analysis.themes = this.extractThemes(themeSection[0])
    }

    return analysis as ReviewAnalysis
  }

  // Extract marketing plan from text
  private extractMarketingFromText(text: string): any {
    // Similar extraction logic for marketing plans
    return {
      overview: 'Marketing plan extracted from text',
      objectives: [],
      tactics: [],
      budget: { total: '$0', breakdown: {} },
      timeline: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: [],
      },
    }
  }

  // Extract scenarios from text
  private extractScenariosFromText(text: string): any[] {
    // Similar extraction logic for scenarios
    return []
  }

  // Helper methods for extraction
  private extractActionItems(text: string): any[] {
    const items: any[] = []
    const bulletPoints = text.match(/[•\-\*]\s*(.+)/g) || []

    bulletPoints.forEach((point, index) => {
      const cleanText = point.replace(/[•\-\*]\s*/, '')
      items.push({
        id: `action-${index}`,
        title: cleanText.substring(0, 50),
        description: cleanText,
        category: 'important',
      })
    })

    return items
  }

  private extractStrategies(text: string): any[] {
    const strategies: any[] = []
    const sections = text.split(/\d+\.\s*/)

    sections.forEach((section, index) => {
      if (section.trim()) {
        strategies.push({
          id: `strategy-${index}`,
          title: section.substring(0, 50),
          description: section,
          category: 'growth',
          expectedImpact: 'Medium',
          implementation: [],
          timeframe: '1-3 months',
          kpis: [],
        })
      }
    })

    return strategies
  }

  private extractPatterns(text: string): any[] {
    const patterns: any[] = []
    const bulletPoints = text.match(/[•\-\*]\s*(.+)/g) || []

    bulletPoints.forEach((point, index) => {
      const cleanText = point.replace(/[•\-\*]\s*/, '')
      patterns.push({
        id: `pattern-${index}`,
        pattern: cleanText.substring(0, 50),
        frequency: 0,
        sentiment: 'neutral',
        recommendation: cleanText,
        examples: [],
      })
    })

    return patterns
  }

  private extractThemes(text: string): any[] {
    const themes: any[] = []
    const themeMatches = text.match(/["']([^"']+)["']/g) || []

    themeMatches.forEach((match, index) => {
      const theme = match.replace(/["']/g, '')
      themes.push({
        name: theme,
        frequency: 0,
        sentiment: 'neutral',
        examples: [],
      })
    })

    return themes
  }

  // Default structures
  private getDefaultCompetitiveAnalysis(): any {
    return {
      overview: 'Competitive analysis pending',
      competitors: [],
      strengthsWeaknesses: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },
      recommendations: [],
      position: 'average',
      metrics: {
        rating: { value: 0, benchmark: 0, percentile: 50 },
        reviewVolume: { value: 0, benchmark: 0, percentile: 50 },
        sentiment: { value: 0, benchmark: 0, percentile: 50 },
      },
      strengths: [],
      weaknesses: [],
      opportunities: [],
    }
  }

  private getDefaultMarketingPlan(): any {
    return {
      overview: 'Marketing plan pending',
      objectives: [],
      tactics: [],
      budget: {
        total: '$0',
        breakdown: {},
      },
      timeline: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: [],
      },
      targetAudiences: {
        primary: [],
        secondary: [],
        untapped: [],
      },
      channels: [],
      messaging: {
        uniqueValue: '',
        keyPoints: [],
        callToAction: '',
      },
    }
  }
}
