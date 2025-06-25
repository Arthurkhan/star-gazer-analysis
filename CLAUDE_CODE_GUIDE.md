# Claude Code Guide for Star-Gazer-Analysis

This guide is specifically for Claude Code to create a comprehensive CLAUDE.MD file that will help future Claude instances work effectively on the Star-Gazer-Analysis project.

## Project Overview

Star-Gazer-Analysis is a Google Maps review analysis tool with AI-powered recommendations for three Bangkok-based businesses:
- The Little Prince Cafe (CAFE)
- Vol de Nuit The Hidden Bar (BAR)
- L'Envol Art Space by Arnaud Nazare-Aga (GALLERY)

The application provides comprehensive review analysis, sentiment tracking, AI recommendations, and business insights through a modern React-based dashboard.

## CRITICAL RULES - MUST FOLLOW ALWAYS

1. **NEVER create mock data or simplified components** unless explicitly told to do so
2. **NEVER replace existing complex components with simplified versions** - always fix the actual problem
3. **ALWAYS work with the existing codebase** - do not create new simplified alternatives
4. **ALWAYS find and fix the root cause of issues** instead of creating workarounds
5. **When debugging issues, focus on fixing the existing implementations**, not replacing it
6. **When something doesn't work, debug and fix it** - don't start over with a simple version
7. **NEVER write code for the user to read or copy** - ALWAYS use GitHub tools to work on the application
8. **NEVER COMPLICATE THINGS** - KEEP IT SIMPLE! DO WHAT YOU ARE ASKED, NOTHING MORE, NOTHING LESS
9. **Always read relevant files on GitHub** to get more context for a solution, modification, or creation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** for styling
- **shadcn/ui** component library (Radix UI based)
- **React Router** for navigation
- **Tanstack Query** for data fetching
- **Recharts** for data visualization
- **Zustand** for state management
- **React Hook Form** with Zod validation

### Backend
- **Supabase** (PostgreSQL database + Edge Functions)
- **n8n** automation for daily review updates
- **OpenAI API** for AI recommendations

### Key Dependencies
- `@supabase/supabase-js` - Supabase client
- `lucide-react` - Icon library
- `date-fns` - Date utilities
- `jspdf` & `xlsx` - Export functionality
- `react-hot-toast` & `sonner` - Toast notifications

## Project Structure

```
star-gazer-analysis/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components (shadcn)
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── analysis/     # Analysis components
│   │   ├── charts/       # Chart components
│   │   └── recommendations/ # AI recommendations
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic & API calls
│   │   ├── ai/          # AI-related services
│   │   ├── analysis/    # Analysis services
│   │   ├── api/         # API services
│   │   └── cache/       # Caching services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── pages/            # Main page components
│   ├── contexts/         # React contexts
│   ├── features/         # Feature-specific code
│   └── integrations/     # External integrations
├── supabase/
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
├── update-logs/          # Detailed update documentation
└── docs/                 # Additional documentation
```

## Key Files Reference

### Core Application
- `/src/App.tsx` - Main application component with routing
- `/src/pages/Dashboard.tsx` - Main dashboard page
- `/src/components/DashboardLayout.tsx` - Layout wrapper

### Data Management
- `/src/hooks/useDashboardData.ts` - Main data fetching hook
- `/src/services/reviewDataService.ts` - Review data service
- `/src/types/reviews.ts` - Review type definitions

### AI & Recommendations
- `/src/services/recommendationService.ts` - Main recommendation service
- `/src/components/recommendations/RecommendationsDashboard.tsx` - UI for recommendations
- `/supabase/functions/generate-recommendations/index.ts` - Edge function for AI

### Analysis
- `/src/services/analysis/` - Analysis services directory
- `/src/components/analysis/` - Analysis UI components
- `/src/utils/businessTypeDetection.ts` - Business type detection

### Environment Configuration
- `.env.local` - Local environment variables (never commit)
- `.env.example` - Example environment template

## Database Schema

The project uses a normalized schema with one table per business plus supporting tables:

```sql
-- Business-specific review tables
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

## Update Log Format

When making updates, create a new file in `/update-logs/` with this format:

### File Naming: `YYYY-MM-DD-brief-description.md`

### Template:
```markdown
# [Feature/Fix Name] - YYYY-MM-DD

## Overview
Brief description of what was implemented/fixed

## Objectives
- Objective 1
- Objective 2
- Objective 3

## Files Modified/Created

### 🆕 NEW FILES:
- `path/to/file.tsx` - Description

### 🔄 MODIFIED FILES:
- `path/to/file.tsx` - What was changed

### 🗑️ DELETED FILES:
- `path/to/file.tsx` - Reason

## Changes Made

### 1. Feature/Component Name
- Specific changes
- Impact

## Technical Details
- Performance improvements
- Architecture changes
- Breaking changes

## Success Criteria: ✅/❌
- ✅ Criterion 1
- ❌ Criterion 2

## Next Steps
- What needs to be done next
```

## Common Development Tasks

### Adding a New Feature
1. Create types in `/src/types`
2. Implement service in `/src/services`
3. Create UI components in `/src/components`
4. Add hooks if needed in `/src/hooks`
5. Update the dashboard or create new pages

### Working with Supabase
- Always use the Supabase client from `/src/integrations/supabase/client`
- Handle errors properly with try-catch blocks
- Use TypeScript types generated from database

### Creating Components
- Use shadcn/ui components as base
- Follow existing patterns for consistency
- Add proper TypeScript types
- Include loading and error states

### Performance Optimization
- Use React.memo for expensive components
- Implement proper data caching
- Use pagination for large datasets
- Optimize bundle size with code splitting

## API Keys and Environment

### Required Environment Variables
```
VITE_SUPABASE_URL=https://nmlrvkcvzzeewhamjxgj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### OpenAI API Key
Currently stored in localStorage: `OPENAI_API_KEY`

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript checking
npm run format          # Format with Prettier

# Supabase
npm run deploy:functions    # Deploy edge functions
npm run functions:serve     # Serve functions locally
npm run functions:logs      # View function logs

# Testing
npm run test            # Run tests
npm run test:coverage   # Coverage report
```

## Important Patterns

### Data Fetching
- Use Tanstack Query for all data fetching
- Implement proper error boundaries
- Add loading states with skeletons

### State Management
- Local component state for UI
- Zustand for global app state
- URL state for filters and navigation

### Error Handling
- Always handle async errors
- Show user-friendly error messages
- Log errors for debugging

### Type Safety
- Use TypeScript strictly
- Generate types from Supabase
- Avoid `any` types

## Features Overview

### Current Features
- Real-time review analysis
- AI-powered recommendations
- Multi-business support
- Visual analytics & charts
- Export functionality (PDF, Excel)
- Period comparisons
- Email notifications (in progress)
- Dark mode support

### Planned Features
- Additional businesses support
- n8n workflow integration
- Advanced filtering options
- Custom dashboard widgets
- Mobile app development

## Business Context

The three businesses are all located in Bangkok and owned by the same person. They represent:
- **The Little Prince Cafe** - A themed cafe
- **Vol de Nuit The Hidden Bar** - A speakeasy-style bar
- **L'Envol Art Space** - An art gallery/cultural space

Each business has unique characteristics that affect review patterns and analysis needs.

## Best Practices

1. **Keep It Simple** - Don't over-engineer solutions
2. **Fix Root Causes** - Don't create workarounds
3. **Use Existing Code** - Don't reinvent the wheel
4. **Document Changes** - Always create update logs
5. **Test Thoroughly** - Verify changes work correctly
6. **Consider Performance** - Optimize for speed
7. **Maintain Consistency** - Follow existing patterns

## When Writing CLAUDE.MD

The CLAUDE.MD file should:
1. Be comprehensive but concise
2. Focus on practical implementation details
3. Include specific code examples
4. Reference actual files in the project
5. Explain the "why" behind architectural decisions
6. Provide troubleshooting guidance
7. List common pitfalls and how to avoid them
8. Include links to relevant documentation
9. Be written for a Claude instance with no prior knowledge
10. Emphasize the critical rules that must never be broken

Remember: The goal is to enable future Claude instances to work effectively on this project without creating simplified alternatives or mock data. They should always work with the real, existing codebase.