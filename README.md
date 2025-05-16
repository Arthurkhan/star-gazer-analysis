# Star-Gazer-Analysis

A Google Maps review analysis tool with AI-powered recommendations for three businesses.

## Recent Fixes (May 16, 2025)

### Fixed White Screen Issue
We've resolved an issue where the application was showing only a white screen with no errors. The problem was caused by:

1. **Circular Dependencies in Toast Components**
   - `toaster.tsx` imported from `hooks/use-toast.ts`
   - `hooks/use-toast.ts` imported from `components/ui/toast.tsx`
   - Both toast systems were used simultaneously in `App.tsx`

2. **Toast System Consolidation**
   - We've consolidated to use only Sonner for toast notifications
   - Deprecated the old custom toast implementation
   - Simplified the `use-toast.ts` hook to work with Sonner
   - Retained backward compatibility for existing code

3. **Authentication Flow Enhancement**
   - Added proper loading state for authentication
   - Improved error handling and logging
   - Resolved potential redirect loops in the auth flow

## Development Setup

```bash
git clone https://github.com/Arthurkhan/star-gazer-analysis
cd star-gazer-analysis
npm install
```

### Environment Variables (.env.local)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key (for testing)
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Project Structure

### Frontend
- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/services` - API and service layers
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions

### Backend
- Supabase PostgreSQL database
- Edge Functions for AI processing
- n8n automation for daily review updates

## Toast System Usage

We're now using Sonner for toast notifications. Import and use the toast hook like this:

```tsx
import { useToast } from "@/hooks/use-toast";

function YourComponent() {
  const { toast } = useToast();
  
  // Usage:
  const showToast = () => {
    toast({
      title: "Success",
      description: "Your action was successful",
      variant: "success", // "default", "destructive", "success", "warning", "info"
    });
  };
  
  return <button onClick={showToast}>Show Toast</button>;
}
```
