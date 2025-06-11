# Deploy Supabase Edge Functions - Quick Guide

The AI recommendations feature requires the Supabase edge function to be deployed. Follow these steps:

## Prerequisites

1. **Install Supabase CLI** (if not already installed):
   ```bash
   # Mac
   brew install supabase/tap/supabase
   
   # Windows (use PowerShell as admin)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Linux/WSL
   brew install supabase/tap/supabase
   # OR
   curl -fsSL https://supabase.io/install.sh | sh
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```
   This will open a browser window for authentication.

## Deploy the Edge Function

1. **Link your project** (only needed once):
   ```bash
   npm run supabase:link
   ```
   Or manually:
   ```bash
   supabase link --project-ref nmlrvkcvzzeewhamjxgj
   ```

2. **Deploy the function**:
   ```bash
   npm run deploy:functions
   ```
   Or manually:
   ```bash
   supabase functions deploy generate-recommendations
   ```

3. **Verify deployment**:
   ```bash
   npm run functions:list
   ```

## Troubleshooting

### Check function logs:
```bash
npm run functions:logs
```

### Common issues:

1. **"Function not found" error**: The function hasn't been deployed. Run the deployment command above.

2. **"Invalid API key" error**: Make sure you've added your OpenAI API key in the app's AI Settings.

3. **"Internal Server Error"**: Check the function logs for details. Usually related to:
   - Invalid request format
   - OpenAI API issues
   - Function timeout

### Test the function locally:
```bash
npm run functions:serve
```

## Next Steps

After deploying the edge function:
1. Go to the app's AI Settings
2. Add your OpenAI API key
3. Test the AI recommendations feature

For detailed documentation, see `/supabase/functions/README.md`
