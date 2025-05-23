# API Documentation - Star-Gazer Analysis

This document provides comprehensive API documentation for the Star-Gazer Analysis application.

## Table of Contents

1. [Overview](#overview)
2. [Supabase APIs](#supabase-apis)
3. [Edge Functions](#edge-functions)
4. [Utility APIs](#utility-apis)
5. [Error Handling](#error-handling)
6. [Performance APIs](#performance-apis)
7. [Authentication](#authentication)

---

## Overview

The Star-Gazer Analysis application uses a combination of Supabase APIs, custom Edge Functions, and utility APIs to provide comprehensive review analysis functionality.

### Base URL
- **Development**: `http://localhost:5173`
- **Production**: TBD

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Supabase Realtime subscriptions

---

## Supabase APIs

### Database Schema

#### Reviews Table
```sql
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id),
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  name text,
  text text,
  text_translated text,
  published_at_date timestamp with time zone,
  review_url text,
  response_from_owner_text text,
  sentiment text,
  staff_mentioned text,
  main_themes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### Businesses Table
```sql
CREATE TABLE businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  location text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### Saved Recommendations Table
```sql
CREATE TABLE saved_recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL,
  business_type text NOT NULL,
  recommendations jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

### Data Access Methods

#### Review Data Service

**Location**: `src/services/reviewDataService.ts`

##### fetchAllReviews()
```typescript
async function fetchAllReviews(): Promise<Review[]>
```
**Purpose**: Fetch all reviews from the database
**Returns**: Array of review objects
**Error Handling**: Throws AppError on failure

##### fetchReviewsByBusiness()
```typescript
async function fetchReviewsByBusiness(businessName: string): Promise<Review[]>
```
**Purpose**: Fetch reviews for a specific business
**Parameters**: 
- `businessName`: Name of the business
**Returns**: Array of review objects
**Error Handling**: Throws AppError on failure

##### fetchPaginatedReviews()
```typescript
async function fetchPaginatedReviews(
  businessName?: string,
  page?: number,
  pageSize?: number
): Promise<{ data: Review[]; totalCount: number; hasMore: boolean }>
```
**Purpose**: Fetch paginated reviews with optional business filtering
**Parameters**:
- `businessName`: Optional business filter
- `page`: Page number (default: 0)
- `pageSize`: Number of items per page (default: 1000)
**Returns**: Paginated result object
**Error Handling**: Throws AppError on failure

---

## Edge Functions

### Generate Recommendations

**Endpoint**: `/functions/v1/generate-recommendations`
**Method**: `POST`
**Location**: `supabase/functions/generate-recommendations/index.ts`

#### Request Format
```typescript
interface RecommendationRequest {
  analysisData: AnalysisSummaryData;
  businessType: string;
  provider: string;
  apiKey: string;
}
```

#### Response Format
```typescript
interface RecommendationResponse {
  success: boolean;
  recommendations: {
    urgent: ActionItem[];
    growth: GrowthStrategy[];
    marketing: MarketingPlan[];
    competitive: CompetitiveAnalysis[];
    future: FutureScenario[];
  };
  error?: string;
}
```

#### Example Request
```typescript
const response = await fetch('/functions/v1/generate-recommendations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    analysisData: summaryData,
    businessType: 'CAFE',
    provider: 'openai',
    apiKey: openaiKey
  })
});
```

#### Error Codes
- `400`: Invalid request format
- `401`: Missing or invalid API key
- `500`: Internal server error
- `503`: AI service unavailable

---

## Utility APIs

### Analysis Utils

**Location**: `src/utils/analysisUtils.ts`

#### generateAnalysisSummary()
```typescript
function generateAnalysisSummary(
  reviews: Review[],
  config?: AnalysisConfig
): AnalysisSummaryData
```
**Purpose**: Generate comprehensive analysis from review data
**Parameters**:
- `reviews`: Array of review objects
- `config`: Optional analysis configuration
**Returns**: Complete analysis summary data
**Performance**: Memoized with 10-minute cache
**Error Handling**: Throws error if no reviews provided

#### calculateBusinessHealthScore()
```typescript
function calculateBusinessHealthScore(
  currentPeriod: PeriodData,
  previousPeriod?: PeriodData
): BusinessHealthScore
```
**Purpose**: Calculate composite business health score
**Parameters**:
- `currentPeriod`: Current period metrics
- `previousPeriod`: Optional previous period for comparison
**Returns**: Health score breakdown (0-100)
**Performance**: Memoized with 3-minute cache

#### calculateSentimentAnalysis()
```typescript
function calculateSentimentAnalysis(reviews: Review[]): SentimentAnalysis
```
**Purpose**: Analyze sentiment distribution and trends
**Parameters**:
- `reviews`: Array of review objects
**Returns**: Sentiment analysis with distribution and trends
**Performance**: Memoized with 3-minute cache

### Performance Optimizations

**Location**: `src/utils/performanceOptimizations.ts`

#### PerformanceMonitor
```typescript
class PerformanceMonitor {
  static startMeasurement(label: string): () => number
  static getAverageTime(label: string): number
  static getStats(label: string): PerformanceStats
  static clearStats(): void
  static getAllStats(): Record<string, PerformanceStats>
}
```

#### memoizeWithExpiry()
```typescript
function memoizeWithExpiry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyFn: (...args: TArgs) => string,
  expiryMs?: number
): (...args: TArgs) => TReturn
```
**Purpose**: Memoize function results with automatic expiration
**Parameters**:
- `fn`: Function to memoize
- `keyFn`: Function to generate cache key
- `expiryMs`: Cache expiration time (default: 5 minutes)
**Returns**: Memoized function

---

## Error Handling

### Error Types

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### AppError Class

```typescript
class AppError extends Error {
  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {}
  )
  
  toLogObject(): Record<string, any>
}
```

### Error Logger

```typescript
class ErrorLogger {
  static getInstance(): ErrorLogger
  logError(error: Error | AppError, context?: Record<string, any>): void
  getErrorHistory(): AppError[]
  getErrorStats(): Record<ErrorType, number>
  clearHistory(): void
}
```

### Error Response Format

All API errors follow this format:
```typescript
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    context?: Record<string, any>;
    timestamp: string;
    sessionId?: string;
  };
}
```

---

## Performance APIs

### Measurement APIs

#### Start Measurement
```typescript
const stopMeasurement = PerformanceMonitor.startMeasurement('operation-name');
// ... perform operation
const duration = stopMeasurement();
```

#### Get Performance Stats
```typescript
const stats = PerformanceMonitor.getStats('operation-name');
// Returns: { count, average, min, max, p50, p95 }
```

### Memory Optimization

#### optimizeMemoryUsage()
```typescript
function optimizeMemoryUsage(): void
```
**Purpose**: Clear expired cache and suggest garbage collection
**Usage**: Call periodically or on page visibility change

#### MemoryLeakDetector
```typescript
class MemoryLeakDetector {
  static addInterval(interval: NodeJS.Timeout): void
  static removeInterval(interval: NodeJS.Timeout): void
  static cleanup(): void
  static getLeakReport(): LeakReport
}
```

---

## Authentication

### API Key Management

Currently, the application uses API keys for external services:

#### OpenAI API Key
- **Storage**: localStorage (key: 'openai-api-key')
- **Usage**: AI recommendation generation
- **Format**: Bearer token
- **Validation**: Tested on first use

#### Future Authentication

Planned authentication methods:
- Supabase Auth integration
- JWT token-based authentication
- Role-based access control (RBAC)
- Multi-tenant support

---

## Rate Limiting

### Current Limits
- **Analysis Generation**: No limits (local computation)
- **AI Recommendations**: Limited by OpenAI API quotas
- **Database Queries**: Limited by Supabase plan

### Planned Limits
- API rate limiting by user/IP
- Request throttling for expensive operations
- Cache-based optimization for repeated requests

---

## Caching Strategy

### Client-Side Caching
- **Analysis Results**: 10-minute cache
- **Health Score**: 3-minute cache
- **Sentiment Analysis**: 3-minute cache
- **Chart Data**: 5-minute cache

### Cache Keys
```typescript
// Analysis cache key format
`analysis-${reviewCount}-${firstReviewId}-${lastReviewId}-${configHash}`

// Performance cache key format  
`performance-${reviewCount}-${startDate}-${endDate}`

// Health score cache key format
`health-${currentReviewCount}-${avgRating}-${previousReviewCount}`
```

### Cache Management
- Automatic expiration based on timestamps
- Manual cache clearing on data updates
- Memory optimization with periodic cleanup

---

## WebSocket APIs (Future)

### Real-time Updates
Planned real-time features:
- Live review updates from Google Maps
- Real-time performance monitoring
- Collaborative dashboard editing
- Live alert notifications

### Subscription Format
```typescript
interface SubscriptionConfig {
  type: 'reviews' | 'alerts' | 'performance';
  businessId?: string;
  filters?: FilterCriteria;
  callback: (data: any) => void;
}
```

---

## API Versioning

### Current Version
- **Version**: v1
- **Format**: No versioning (single version)
- **Compatibility**: Breaking changes require migration

### Future Versioning
- URL-based versioning: `/api/v2/`
- Header-based versioning: `API-Version: 2.0`
- Backward compatibility for 2 major versions

---

## Testing APIs

### Development Endpoints
- **Health Check**: `/api/health`
- **Performance Stats**: `/api/performance`
- **Error Logs**: `/api/errors`
- **Cache Status**: `/api/cache`

### Test Data
- Mock review data for development
- Seed data for testing environments
- Performance benchmarking datasets

---

## Migration Guide

### API Changes
When APIs change:
1. Update interface definitions
2. Implement backward compatibility
3. Update client-side usage
4. Test migration scenarios
5. Update documentation

### Database Schema Changes
1. Create migration scripts
2. Test with existing data
3. Plan rollback procedures
4. Update API endpoints
5. Update client code

---

This API documentation should be updated whenever APIs are modified or new endpoints are added. All APIs should maintain backward compatibility whenever possible.
