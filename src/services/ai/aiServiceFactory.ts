import type { AIProvider } from './baseAIProvider'
import { OpenAIProvider } from './openAIProvider'
import { ClaudeProvider } from './claudeProvider'
import { GeminiProvider } from './geminiProvider'
import type { AIConfig, AIProviderType } from '@/types/aiService'

export class AIServiceFactory {
  private static providers: Map<string, AIProvider> = new Map()

  static createProvider(config: AIConfig): AIProvider {
    const key = `${config.provider}-${config.apiKey}`

    if (this.providers.has(key)) {
      return this.providers.get(key)!
    }

    let provider: AIProvider

    switch (config.provider) {
      case 'openai':
        provider = new OpenAIProvider(config)
        break
      case 'claude':
        provider = new ClaudeProvider(config)
        break
      case 'gemini':
        provider = new GeminiProvider(config)
        break
      default:
        throw new Error(`Unknown AI provider: ${config.provider}`)
    }

    this.providers.set(key, provider)
    return provider
  }

  static clearCache() {
    this.providers.clear()
  }

  static async testProvider(config: AIConfig): Promise<boolean> {
    try {
      const provider = this.createProvider(config)
      return await provider.testConnection()
    } catch (error) {
      console.error('Provider test failed:', error)
      return false
    }
  }
}

// Default configurations for each provider
export const defaultConfigs: Record<AIProviderType, Partial<AIConfig>> = {
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 3000,
  },
  claude: {
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 3000,
  },
  gemini: {
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 3000,
  },
}
