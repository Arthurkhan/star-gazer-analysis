# Supabase Edge Functions

This directory contains the edge functions for the Star-Gazer-Analysis project.

## Functions

### generate-recommendations
Generates AI-powered recommendations for businesses based on their reviews using OpenAI GPT-4.

## Prerequisites

1. Install Supabase CLI:
   - Mac: `brew install supabase/tap/supabase`
   - Windows: Download from [Supabase CLI releases](https://github.com/supabase/cli/releases)
   - Linux: `curl -fsSL https://supabase.io/install.sh | sh`

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref nmlrvkcvzzeewhamjxgj
   ```

## Deployment

### Deploy a single function:
```bash
# From project root
supabase functions deploy generate-recommendations

# Or from this directory
cd supabase/functions
supabase functions deploy generate-recommendations
```

### Deploy all functions:
```bash
# From project root
npm run deploy:functions
```

## Local Development

### Run functions locally:
```bash
supabase functions serve generate-recommendations --env-file ./supabase/.env.local
```

### Test locally:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-recommendations' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"businessData": {...}, "apiKey": "your-openai-key"}'
```

## Environment Variables

The edge function uses the following environment variables:
- None required (API key is passed from the frontend)

## Troubleshooting

### Function not found (404)
- Make sure the function is deployed: `supabase functions deploy generate-recommendations`
- Check if the function is listed: `supabase functions list`

### Internal Server Error (500)
- Check function logs: `supabase functions logs generate-recommendations`
- Verify the OpenAI API key is valid
- Ensure the request body has the correct format

### Access denied
- Check CORS configuration in the function
- Verify the Supabase anon key is correct

## Function Details

**Endpoint**: `POST /functions/v1/generate-recommendations`

**Request Body**:
```json
{
  "businessData": {
    "businessName": "string",
    "businessType": "string",
    "reviews": [
      {
        "stars": "number",
        "text": "string",
        "publishedAtDate": "string"
      }
    ],
    "businessContext": {} // optional
  },
  "apiKey": "string" // OpenAI API key
}
```

**Response**: Recommendations object with urgent actions, growth strategies, etc.
