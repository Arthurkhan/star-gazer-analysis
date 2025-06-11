# AI Service Architecture

## Overview
Star-Gazer-Analysis uses cloud-based AI providers for generating business recommendations and insights from Google Maps reviews. The system supports multiple AI providers with a flexible architecture.

## Supported AI Providers

### 1. OpenAI (Default)
- **Model**: GPT-4 Turbo
- **Use Case**: Primary recommendation engine
- **Features**: Advanced reasoning, comprehensive analysis
- **Configuration**: Requires OpenAI API key

### 2. Anthropic Claude
- **Model**: Claude 3 Opus
- **Use Case**: Detailed analysis and creative solutions
- **Features**: Excellent for nuanced business insights
- **Configuration**: Requires Claude API key

### 3. Google Gemini
- **Model**: Gemini Pro
- **Use Case**: Fast and efficient analysis
- **Features**: Good for general business recommendations
- **Configuration**: Requires Gemini API key

## Architecture Components

### AI Service Factory (`/src/services/ai/aiServiceFactory.ts`)
- Creates and manages AI provider instances
- Caches provider instances for efficiency
- Provides provider testing functionality

### Provider Implementations
- `openAIProvider.ts` - OpenAI GPT-4 implementation
- `claudeProvider.ts` - Anthropic Claude implementation
- `geminiProvider.ts` - Google Gemini implementation
- `baseAIProvider.ts` - Abstract base class for all providers

### Recommendation Service (`/src/services/recommendationService.ts`)
- Main service for generating recommendations
- Currently uses OpenAI via Supabase Edge Function
- Handles response transformation and error handling

### Edge Function (`/supabase/functions/generate-recommendations`)
- Serverless function for AI processing
- Keeps API keys secure on the server
- Handles rate limiting and timeouts

## Configuration

### Setting API Keys
API keys are stored locally in the browser and never sent to our servers:

```javascript
// Set API key in localStorage
localStorage.setItem('OPENAI_API_KEY', 'your-api-key');
localStorage.setItem('CLAUDE_API_KEY', 'your-api-key');
localStorage.setItem('GEMINI_API_KEY', 'your-api-key');

// Set default provider
localStorage.setItem('AI_PROVIDER', 'openai');
```

### AI Settings Page
Users can configure their AI providers through the settings page:
- Navigate to `/ai-settings`
- Enter API keys for desired providers
- Test connections
- Select default provider

## Data Flow

1. **Review Data Collection**
   - Reviews fetched from Supabase database
   - Preprocessed and formatted for AI analysis

2. **AI Processing**
   - Data sent to recommendation service
   - Service calls Supabase Edge Function
   - Edge Function processes with selected AI provider

3. **Response Handling**
   - AI response parsed and transformed
   - Recommendations formatted for UI display
   - Results cached for performance

## Error Handling

The system includes comprehensive error handling:
- Invalid API key detection
- Rate limit handling
- Timeout protection (30 seconds)
- Network error recovery
- Fallback recommendations

## Security Considerations

- API keys stored only in browser localStorage
- Keys never transmitted to application servers
- Edge Functions handle actual AI API calls
- No sensitive data logged or stored

## Future Enhancements

- Support for multiple AI providers simultaneously
- A/B testing between providers
- Custom prompt templates per business type
- Recommendation caching and history
- Batch processing for multiple businesses

## Why Cloud-Only AI?

After evaluation, we decided to focus exclusively on cloud-based AI providers:

1. **Quality**: Cloud providers offer superior analysis quality
2. **Maintenance**: No need to manage local AI models
3. **Scalability**: Cloud services handle any workload
4. **Updates**: Automatic access to latest AI improvements
5. **Simplicity**: Cleaner codebase and architecture

## Migration Notes

If you previously had Local AI configurations, no migration is needed as the feature was never fully implemented. Simply configure your preferred cloud AI provider in the settings.