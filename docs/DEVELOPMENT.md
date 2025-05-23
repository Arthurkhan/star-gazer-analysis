# Development Guidelines - Star-Gazer Analysis

This document provides comprehensive development guidelines for maintaining and extending the Star-Gazer Analysis application.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Environment](#development-environment)
3. [Coding Standards](#coding-standards)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Performance Best Practices](#performance-best-practices)
6. [Testing Guidelines](#testing-guidelines)
7. [Deployment Process](#deployment-process)
8. [Contributing Guidelines](#contributing-guidelines)

---

## Project Structure

### Directory Organization

```
star-gazer-analysis/
├── src/
│   ├── components/          # React components
│   │   ├── analysis/        # Analysis-specific components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── review-analysis/ # Review analysis components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services and business logic
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and helpers
│   └── integrations/       # Third-party integrations
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── docs/                   # Documentation
├── public/                 # Static assets
└── tests/                  # Test files
```

### File Naming Conventions

#### Components
- **React Components**: PascalCase (e.g., `AnalysisSummary.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useDashboardData.ts`)
- **Utilities**: camelCase (e.g., `analysisUtils.ts`)
- **Types**: camelCase with descriptive suffix (e.g., `analysisSummary.ts`)

#### Directories
- **lowercase-with-hyphens** for multi-word directories
- **camelCase** for single-word directories where appropriate

---

## Development Environment

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **TypeScript**: Version 5.0.0 or higher
- **Git**: Version 2.30.0 or higher

### Environment Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Arthurkhan/star-gazer-analysis.git
   cd star-gazer-analysis
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_key

# Development Configuration
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
npm run format          # Format code with Prettier

# Maintenance
npm run clean           # Clean build artifacts
npm run reset           # Clean and reinstall dependencies
```

---

## Coding Standards

### TypeScript Guidelines

#### Strict Mode Compliance
- Always use TypeScript strict mode
- No `any` types unless absolutely necessary
- Prefer `unknown` over `any` when type is uncertain
- Use proper null checking with optional chaining

```typescript
// ✅ Good
interface UserData {
  name: string;
  email?: string;
  age: number | null;
}

const getUserEmail = (user: UserData): string | undefined => {
  return user.email?.toLowerCase();
};

// ❌ Bad
const getUserEmail = (user: any): any => {
  return user.email.toLowerCase();
};
```

#### Type Definitions
- Define interfaces for all component props
- Use unions for controlled string values
- Export types that may be reused
- Group related types in dedicated files

```typescript
// ✅ Good
export interface AnalysisConfig {
  timePeriod: 'all' | 'last30days' | 'last90days' | 'custom';
  includeStaffAnalysis: boolean;
  includeThematicAnalysis: boolean;
  comparisonPeriod: 'previous' | 'yearOverYear' | 'none';
}

// ❌ Bad
interface Props {
  config: {
    timePeriod: string;
    includeStaffAnalysis: boolean;
    includeThematicAnalysis: boolean;
    comparisonPeriod: string;
  };
}
```

### React Guidelines

#### Component Structure
```typescript
// Standard component structure
import React, { useMemo, useState, useCallback } from 'react';
import { SomeType } from '@/types/componentTypes';
import { utilityFunction } from '@/utils/helpers';

interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
  children?: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({
  requiredProp,
  optionalProp = 0,
  children
}) => {
  // State
  const [localState, setLocalState] = useState<string>('');
  
  // Memoized values
  const computedValue = useMemo(() => {
    return utilityFunction(requiredProp);
  }, [requiredProp]);
  
  // Event handlers
  const handleEvent = useCallback(() => {
    setLocalState('new value');
  }, []);
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

#### Hooks Usage
- Use custom hooks for reusable logic
- Implement proper dependency arrays
- Avoid unnecessary re-renders with memoization

```typescript
// ✅ Good - Custom hook with proper dependencies
export function useAnalysisData(reviews: Review[], config: AnalysisConfig) {
  return useMemo(() => {
    return generateAnalysisSummary(reviews, config);
  }, [reviews, config]);
}

// ❌ Bad - Missing dependencies
export function useAnalysisData(reviews: Review[], config: AnalysisConfig) {
  return useMemo(() => {
    return generateAnalysisSummary(reviews, config);
  }, [reviews]); // Missing config dependency
}
```

### Code Formatting

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## Architecture Guidelines

### Component Architecture

#### Component Hierarchy
```
App
├── ErrorBoundary (Page-level)
├── Dashboard
│   ├── BusinessSelector
│   ├── DashboardContent
│   │   ├── ErrorBoundary (Section-level)
│   │   ├── AnalysisSummary
│   │   │   ├── ExecutiveSummaryCard
│   │   │   ├── PerformanceMetricsGrid
│   │   │   └── ... (other analysis components)
│   │   └── ReviewsTable
│   └── RecommendationsDashboard
```

#### Data Flow Architecture
```
useDashboardData (Hook)
    ↓
Dashboard (Container)
    ↓
DashboardContent (Layout)
    ↓
AnalysisSummary (Main Analysis)
    ↓
Individual Analysis Components
```

### State Management

#### Local State
- Use `useState` for component-specific state
- Use `useReducer` for complex state logic
- Prefer props drilling for simple cases

#### Global State
- Use React Context for app-wide state
- Consider Zustand for complex global state
- Avoid Redux unless absolutely necessary

```typescript
// ✅ Good - Context for global state
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  settings: AppSettings;
}

const AppContext = createContext<AppState | null>(null);

// ✅ Good - Local state for component logic
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

### Service Layer Architecture

#### Service Organization
```typescript
// Data services
export class ReviewDataService {
  async fetchReviews(): Promise<Review[]> { }
  async fetchBusinessData(): Promise<Business[]> { }
}

// Business logic services
export class AnalysisService {
  generateSummary(reviews: Review[]): AnalysisSummaryData { }
  calculateMetrics(data: ReviewData): PerformanceMetrics { }
}

// Integration services
export class RecommendationService {
  async generateRecommendations(data: AnalysisData): Promise<Recommendations> { }
}
```

#### Error Handling Strategy
```typescript
// Service-level error handling
export class DataService {
  async fetchData(): Promise<Data> {
    try {
      const response = await api.get('/data');
      return response.data;
    } catch (error) {
      throw new AppError(
        'Failed to fetch data',
        ErrorType.NETWORK,
        ErrorSeverity.HIGH,
        { originalError: error }
      );
    }
  }
}
```

---

## Performance Best Practices

### Optimization Strategies

#### Component Optimization
```typescript
// ✅ Memoize expensive components
export const ExpensiveComponent = React.memo(({ data, config }) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);
  
  return <div>{/* Render processed data */}</div>;
});

// ✅ Lazy load heavy components
const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent />
    </Suspense>
  );
}
```

#### Data Processing Optimization
```typescript
// ✅ Use memoization for expensive calculations
const calculateMetrics = memoizeWithExpiry(
  (reviews: Review[]) => {
    return expensiveCalculation(reviews);
  },
  (reviews) => `metrics-${reviews.length}`,
  5 * 60 * 1000 // 5 minutes
);

// ✅ Batch process large datasets
async function processLargeDataset(data: LargeData[]): Promise<ProcessedData[]> {
  return processBatch(data, processItem, 50, 10);
}
```

#### Bundle Optimization
- Use dynamic imports for route-based code splitting
- Lazy load non-critical components
- Optimize images and assets
- Use tree shaking for unused code elimination

### Memory Management

#### Memory Leak Prevention
```typescript
// ✅ Cleanup event listeners
useEffect(() => {
  const handler = (event: Event) => { /* handle event */ };
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);

// ✅ Cancel async operations
useEffect(() => {
  let cancelled = false;
  
  async function fetchData() {
    const data = await api.fetchData();
    if (!cancelled) {
      setData(data);
    }
  }
  
  fetchData();
  
  return () => {
    cancelled = true;
  };
}, []);
```

---

## Testing Guidelines

### Testing Strategy

#### Unit Testing
- Test individual functions and components
- Mock external dependencies
- Focus on business logic and edge cases
- Aim for 80%+ code coverage

```typescript
// Example unit test
describe('calculateBusinessHealthScore', () => {
  it('should calculate correct health score for high-performing business', () => {
    const mockData: PeriodData = {
      metrics: {
        averageRating: 4.5,
        sentimentScore: 85,
        responseRate: 90,
        totalReviews: 100
      }
    };
    
    const result = calculateBusinessHealthScore(mockData);
    
    expect(result.overall).toBeGreaterThan(80);
    expect(result.breakdown.rating).toBe(90);
  });
});
```

#### Integration Testing
- Test component interactions
- Test data flow between services
- Test API integrations
- Test user workflows

#### End-to-End Testing
- Test complete user journeys
- Test critical business flows
- Test error scenarios
- Test performance under load

### Testing Tools

#### Recommended Stack
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Playwright**: E2E testing

### Test Organization
```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   └── workflows/
└── e2e/
    ├── critical-paths/
    └── regression/
```

---

## Deployment Process

### Build Process

#### Production Build
```bash
# Build with optimizations
npm run build

# Verify build
npm run preview

# Type check
npm run type-check

# Lint check
npm run lint
```

#### Environment Configuration
```bash
# Production environment variables
VITE_APP_ENV=production
VITE_SUPABASE_URL=production_url
VITE_SUPABASE_ANON_KEY=production_key
VITE_DEBUG_MODE=false
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Deployment Checklist

#### Pre-deployment
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Performance benchmarks met
- [ ] Security scan complete
- [ ] Documentation updated

#### Post-deployment
- [ ] Health checks passing
- [ ] Performance monitoring active
- [ ] Error monitoring configured
- [ ] User acceptance testing
- [ ] Rollback plan ready

---

## Contributing Guidelines

### Development Workflow

#### Feature Development
1. **Create Feature Branch**: `git checkout -b feature/feature-name`
2. **Implement Changes**: Follow coding standards
3. **Write Tests**: Ensure adequate test coverage
4. **Update Documentation**: Keep docs current
5. **Create Pull Request**: Use PR template

#### Pull Request Process
1. **Code Review**: At least one approver required
2. **Automated Checks**: All CI checks must pass
3. **Testing**: Manual testing of new features
4. **Documentation**: Verify documentation updates
5. **Merge**: Squash and merge to main

### Code Review Guidelines

#### Reviewer Checklist
- [ ] Code follows project standards
- [ ] Tests are comprehensive
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Documentation is updated
- [ ] Error handling is appropriate

#### Common Review Points
- TypeScript type safety
- Component performance
- Error boundary usage
- Accessibility compliance
- Mobile responsiveness

### Release Process

#### Version Management
- Follow Semantic Versioning (SemVer)
- Update version in package.json
- Create git tags for releases
- Update CHANGELOG.md

#### Release Types
- **Patch**: Bug fixes and minor updates
- **Minor**: New features and enhancements
- **Major**: Breaking changes and architecture updates

---

## Maintenance Guidelines

### Code Maintenance

#### Regular Tasks
- **Weekly**: Update dependencies, review performance metrics
- **Monthly**: Security audit, code quality review
- **Quarterly**: Architecture review, refactoring opportunities

#### Performance Monitoring
- Monitor bundle size growth
- Track component render times
- Monitor memory usage patterns
- Review error rates and types

### Documentation Maintenance

#### Keep Updated
- Component documentation with API changes
- User guides with new features
- Development guidelines with process changes
- Architecture documentation with system evolution

### Security Considerations

#### Security Practices
- Regular dependency updates
- Security scanning in CI/CD
- Input validation and sanitization
- Secure API key management
- Error message sanitization

---

This development guide should be followed by all contributors to maintain code quality, performance, and consistency across the Star-Gazer Analysis application.
