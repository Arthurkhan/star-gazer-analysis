# Iframe Embedding Fix - 2025-06-10

## Overview
Fixed issues preventing the Star-Gazer-Analysis app from working properly when embedded as an iframe in Squarespace

## Objectives
- Enable the app to work inside iframes
- Fix localStorage access issues in iframe context
- Provide debugging tools for iframe issues
- Update Supabase authentication for iframe compatibility

## Files Modified/Created

### 🆕 NEW FILES:
- `public/iframe-test.html` - Diagnostic page for testing iframe functionality

### 🔄 MODIFIED FILES:
- `src/integrations/supabase/client.ts` - Added iframe-safe storage handlers

### 🗑️ DELETED FILES:
- None

## Changes Made

### 1. Supabase Client Updates
- Added try-catch blocks around localStorage operations
- Configured auth to handle storage errors gracefully in iframe context
- Set `detectSessionInUrl: true` for better iframe compatibility
- Set `flowType: 'implicit'` for simpler auth flow

### 2. Created Iframe Test Page
- Built diagnostic tool to test iframe embedding
- Checks localStorage availability
- Tests Supabase connection
- Provides debug logging
- Detects if running in iframe context

## Technical Details
- Storage operations now fail silently in restricted iframe contexts
- Authentication persists in memory when localStorage is unavailable
- Test page available at: `/iframe-test.html`

## Success Criteria: ✅
- ✅ Supabase client handles iframe restrictions
- ✅ Storage errors don't crash the app
- ✅ Diagnostic tool created for testing

## Next Steps for Troubleshooting

### 1. Test the iframe functionality:
Visit: https://googlemaps-reviews-analysis.netlify.app/iframe-test.html
- This will show if the app can run in an iframe
- Check the debug output for any errors

### 2. In Squarespace, try this simpler test first:
```html
<iframe 
  src="https://googlemaps-reviews-analysis.netlify.app/iframe-test.html" 
  style="width: 100%; height: 600px; border: none;">
</iframe>
```

### 3. Check browser console for errors:
- Right-click on your Squarespace page
- Select "Inspect" or "Developer Tools"
- Go to the Console tab
- Look for any red error messages

### 4. Common iframe issues and solutions:
- **Mixed content**: Make sure your Squarespace site uses HTTPS
- **Content Security Policy**: Check if Squarespace blocks iframes
- **Cookie restrictions**: The app may need third-party cookies enabled

### 5. Alternative embedding method:
If iframe doesn't work, consider using a link that opens the app in a new tab:
```html
<a href="https://googlemaps-reviews-analysis.netlify.app" 
   target="_blank" 
   style="display: inline-block; padding: 10px 20px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
  Open Review Analysis Tool
</a>
```

## Important Notes
- **DO NOT** add lenvolbkk.com as a custom domain in Netlify
- The app should remain at its Netlify URL
- Your Squarespace site embeds the Netlify app via iframe
