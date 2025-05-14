# Generate Recommendations Edge Function

This Supabase edge function provides AI-powered business recommendations based on review analysis data.

## Configuration

The function supports multiple AI providers:
- OpenAI (GPT-4)
- Anthropic (Claude) - Coming soon
- Google AI (Gemini) - Coming soon

## Environment Variables

Set the following environment variables in your Supabase dashboard:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Request Format

Send a POST request with the following body:

```json
{
  "analysisData": {
    "business": "Business Name",
    "businessType": "restaurant",
    "reviews": [...],
    "metrics": {
      "totalReviews": 100,
      "avgRating": 4.5,
      "responseRate": 0.8
    },
    "patterns": {...},
    "sentiment": {...}
  },
  "businessType": "restaurant",
  "provider": "openai",
  "apiKey": "optional_api_key"
}
```

## Response Format

The function returns recommendations in this format:

```json
{
  "urgentActions": [...],
  "growthStrategies": [...],
  "patternInsights": [...],
  "competitivePosition": {...},
  "customerAttractionPlan": {...},
  "scenarios": [...],
  "longTermStrategies": [...]
}
```

## Local Development

To run locally:

```bash
supabase functions serve generate-recommendations --env-file ./supabase/.env.local
```

## Deployment

Deploy to Supabase:

```bash
supabase functions deploy generate-recommendations
```
