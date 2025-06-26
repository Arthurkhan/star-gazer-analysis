# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL RULES - MUST FOLLOW ALWAYS

1. **NEVER create mock data or simplified components** unless explicitly told to do so
2. **NEVER replace existing complex components with simplified versions** - always fix the actual problem
3. **ALWAYS work with the existing codebase** - do not create new simplified alternatives
4. **ALWAYS find and fix the root cause of issues** instead of creating workarounds
5. **When debugging issues, focus on fixing the existing implementations**, not replacing them
6. **When something doesn't work, debug and fix it** - don't start over with a simple version
7. **NEVER write code for the user to read or copy** - ALWAYS use tools to work on the application
8. **NEVER COMPLICATE THINGS** - KEEP IT SIMPLE! DO WHAT YOU ARE ASKED, NOTHING MORE, NOTHING LESS
9. **Always read relevant files** to get more context for a solution, modification, or creation

## Project Overview

Star-Gazer-Analysis is a Google Maps review analysis tool with AI-powered recommendations for three Bangkok-based businesses:
- **The Little Prince Cafe** (CAFE)
- **Vol de Nuit The Hidden Bar** (BAR)  
- **L'Envol Art Space by Arnaud Nazare-Aga** (GALLERY)

## Build & Development Commands

### Essential Commands
```bash
npm run dev          # Start development server (localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run build:analyze # Build with bundle analyzer
npm run preview      # Preview production build
```

### Code Quality (Run before commits)
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Testing
```bash
npm run test         # Run tests with Vitest
npm run test:ui      # Run tests with UI
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:watch   # Watch mode for tests
```

### Utility Commands
```bash
npm run clean        # Clean build artifacts
npm run reset        # Clean and reinstall dependencies
npm run verify-setup # Verify environment setup
```

### Supabase Commands
```bash
npm run supabase:link # Link to Supabase project
npm run deploy:functions # Deploy edge functions
npm run functions:serve # Serve functions locally
npm run functions:logs  # View function logs
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **State Management**: Zustand + Tanstack Query
- **AI Integration**: Multi-provider (OpenAI, Claude, Gemini)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Project Structure
```
src/
├── components/        # React components organized by domain
│   ├── ui/           # Reusable UI components (shadcn/ui)
│   ├── dashboard/    # Dashboard-specific components
│   ├── analysis/     # Analysis and chart components
│   ├── recommendations/ # AI recommendations UI
│   └── ...
├── features/         # Feature-based organization
│   ├── analytics/    # Analytics domain
│   ├── dashboard/    # Dashboard domain
│   ├── recommendations/ # AI recommendations
│   └── reviews/      # Review processing
├── services/         # API services and business logic
│   ├── ai/          # AI service abstraction layer
│   ├── analysis/    # Analysis services
│   ├── cache/       # Caching services
│   └── ...
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── pages/           # Route components
└── integrations/    # External integrations (Supabase)
```

## Key Files Reference

### Core Application
- `src/App.tsx` - Main application with routing and auth
- `src/pages/Dashboard.tsx` - Main dashboard page
- `src/components/DashboardLayout.tsx` - Layout wrapper

### Data Management
- `src/hooks/useDashboardData.ts` - Main data fetching hook
- `src/services/reviewDataService.ts` - Review data service
- `src/types/reviews.ts` - Review type definitions
- `src/integrations/supabase/client.ts` - Supabase client configuration

### AI & Recommendations
- `src/services/recommendationService.ts` - Main recommendation service
- `src/services/ai/aiServiceFactory.ts` - AI provider factory
- `src/services/ai/baseAIProvider.ts` - Base AI provider interface
- `src/components/recommendations/RecommendationsDashboard.tsx` - Recommendations UI
- `supabase/functions/generate-recommendations/index.ts` - Edge function for AI processing

### Analysis Components
- `src/services/analysis/` - Analysis services directory
- `src/components/analysis/` - Analysis UI components
- `src/utils/businessTypeDetection.ts` - Business type detection

## AI Service Architecture

### Multi-Provider Support
The AI system uses a factory pattern with provider abstraction:

```typescript
// AI providers available
- OpenAI (GPT-4o-mini)
- Claude (via Anthropic API)
- Gemini (Google AI)
```

### Business-Specific Prompts
AI prompts are tailored for 6 business types:
- Cafes, Restaurants, Bars, Art Galleries, Retail Stores, Service Businesses
- Generic prompts for other business types

### Data Flow
```
Frontend → AIServiceFactory → Provider Instance → Edge Function → AI API
BusinessData → RecommendationService → Edge Function → AI Provider → Structured Response
```

### Recent AI Updates
- Recommendation count increased from 3 to 5 items per category
- Enhanced metadata tracking (provider, model, response time)
- Improved error handling with fallback responses
- Caching implemented in edge functions (1-hour TTL)

## Database Schema

### Core Tables Structure
```sql
-- Business-specific review tables (one per business)
"L'Envol Art Space" (
  stars integer,
  name text,
  text text,
  textTranslated text,
  publishedAtDate timestamp,
  reviewUrl text,
  responseFromOwnerText text,
  sentiment text,
  staffMentioned text,
  mainThemes text,
  language text
)

-- Same structure for:
-- "The Little Prince Cafe"
-- "Vol de Nuit, The Hidden Bar"

-- Supporting tables
saved_recommendations (
  id uuid PRIMARY KEY,
  business_name text,
  business_type text,
  recommendations jsonb,
  created_at timestamp
)
```

### Data Access Patterns
- Each business has its own table for reviews
- Recommendations stored as JSON in unified table
- Business context enhances AI recommendation quality

## Environment Setup

### Required Environment Variables
```bash
# .env.local (never commit this file)
VITE_SUPABASE_URL=https://nmlrvkcvzzeewhamjxgj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### AI API Keys
- Stored in browser localStorage: `OPENAI_API_KEY`
- Passed to edge functions for secure processing
- Test connection functionality available in UI

### Troubleshooting Setup
1. Run `npm run verify-setup` to check configuration
2. Restart dev server after creating/modifying `.env.local`
3. Clear Vite cache: `rm -rf node_modules/.vite`

## Development Patterns

### Data Fetching with Tanstack Query
```typescript
// Always use React Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['reviews', businessId],
  queryFn: () => fetchReviews(businessId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Error Handling
- Comprehensive error boundaries throughout app
- Graceful degradation for offline scenarios
- User-friendly error messages with actionable steps
- Logging service for debugging (`src/services/logging/`)

### Component Patterns
- Use shadcn/ui components as base
- Compound components for complex UI
- Custom hooks for business logic
- TypeScript strict mode for type safety

### State Management
- Local component state for UI interactions
- Zustand for global app state
- Tanstack Query for server state
- URL state for filters and navigation

## Performance Optimizations

### Frontend Optimizations
- Lazy loading for charts and analysis components
- Virtual scrolling for large review lists (`src/components/VirtualizedReviewList.tsx`)
- React.memo for expensive components
- Optimized Vite build with manual chunk splitting

### Backend Optimizations
- Edge function caching (1-hour TTL)
- Optimized database queries
- Connection pooling via Supabase

### Mobile Responsiveness
- Mobile-first design approach
- Safe area insets for iOS devices
- Touch-friendly UI elements (44px minimum)
- Responsive breakpoints: xs(320px), sm(640px), md(768px), lg(1024px), xl(1280px)

## Key Features

### Current Features
- Real-time review analysis and sentiment tracking
- AI-powered recommendations (5 urgent actions + 5 growth strategies)
- Multi-business support with business-specific insights
- Visual analytics with Recharts
- Export functionality (PDF, Excel)
- Period comparisons and trend analysis
- Email notifications system
- Dark mode support
- Debug mode (Ctrl+Shift+D)

### Analysis Capabilities
- Sentiment analysis with positive/negative/neutral classification
- Theme extraction and categorization
- Staff mention detection
- Language detection and translation support
- Temporal analysis and trend identification
- Competitive analysis and benchmarking

## Common Development Tasks

### Adding New Features
1. Create types in `src/types/`
2. Implement service in `src/services/`
3. Create UI components in `src/components/`
4. Add hooks if needed in `src/hooks/`
5. Update dashboard or create new pages
6. Add tests in `__tests__/` folders

### Working with Supabase
- Always use client from `src/integrations/supabase/client.ts`
- Handle errors properly with try-catch blocks
- Use TypeScript types from `src/integrations/supabase/types.ts`
- Test database connections in development

### Debugging Issues
- Use browser DevTools for client-side debugging
- Check Supabase logs for backend issues
- Use debug mode (Ctrl+Shift+D) for diagnostic panel
- Review error boundaries and logging service

## Update Log Format

When making changes, create update logs in `/update-logs/` with format:
`YYYY-MM-DD-brief-description.md`

Include:
- Overview of changes
- Files modified/created/deleted
- Technical details
- Success criteria
- Next steps

## Common Pitfalls to Avoid

1. **Don't create simplified mock components** - always work with existing complex components
2. **Don't ignore TypeScript errors** - fix them properly
3. **Don't forget error handling** - always handle async operations
4. **Don't skip environment setup** - verify `.env.local` exists and is correct
5. **Don't bypass the AI service abstraction** - use the factory pattern
6. **Don't modify database schema** without proper migrations
7. **Don't commit sensitive data** - use environment variables and localStorage

## Timezone Handling

**Important**: The application has a timezone issue documented in `update-logs/2025-06-18-timezone-analysis-report.md`:
- Database stores timestamps in UTC
- Application displays in UTC+7 (Bangkok time)
- This affects period comparisons and date filtering
- When working with dates, always consider timezone conversion

## Testing Strategy

- Unit tests with Vitest and Testing Library
- Test files co-located with source code
- Mock external dependencies (Supabase, AI APIs)
- Test error scenarios and edge cases
- Run tests before committing changes

## Deployment

### Production Build
```bash
npm run build    # Creates optimized build in dist/
npm run preview  # Test production build locally
```

### Supabase Functions
```bash
npm run deploy:functions  # Deploy edge functions
npm run functions:logs    # Monitor function logs
```

### Monitoring
- Web vitals monitoring built-in
- Performance monitoring in production
- Error tracking via logging service
- Connection status monitoring

This guide ensures future Claude instances can work effectively with the existing codebase without creating simplified alternatives or mock implementations.