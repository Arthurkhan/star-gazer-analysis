# Deploying Supabase Edge Functions

This guide explains how to deploy the edge functions for the Star-Gazer-Analysis project.

## Prerequisites

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   ```

2. **Logged in to Supabase**
   ```bash
   supabase login
   ```

3. **Project linked**
   ```bash
   supabase link --project-ref nmlrvkcvzzeewhamjxgj
   ```

## Deploy the Edge Function

To deploy the `generate-recommendations` function:

```bash
supabase functions deploy generate-recommendations
```

## Verify Deployment

After deployment, you should see:
```
Function "generate-recommendations" deployed successfully
```

## Test the Function

You can test the function using the Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Find `generate-recommendations`
4. Use the testing interface

## Common Issues

### Function Not Found (404)
- Make sure the function is deployed
- Check that the function name matches exactly

### Authentication Error (401) 
- Verify your OpenAI API key is valid
- Ensure the API key has proper permissions

### Rate Limit (429)
- Wait a moment and try again
- Check your OpenAI usage limits

### Model Not Found
- The edge function now uses `gpt-3.5-turbo-1106` which should be available
- If issues persist, check OpenAI model availability

## Environment Variables

The function doesn't require environment variables - the API key is passed in the request body.

## Logs

View function logs:
```bash
supabase functions logs generate-recommendations
```

## Local Development

To run the function locally:
```bash
supabase functions serve generate-recommendations
```

The function will be available at:
```
http://localhost:54321/functions/v1/generate-recommendations
```
