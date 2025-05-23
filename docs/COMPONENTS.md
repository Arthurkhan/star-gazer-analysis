# Component Documentation - Star-Gazer Analysis

This document provides comprehensive documentation for all components in the Star-Gazer Analysis application.

## Table of Contents

1. [Analysis Components](#analysis-components)
2. [UI Components](#ui-components)
3. [Error Handling Components](#error-handling-components)
4. [Performance Components](#performance-components)
5. [Component Best Practices](#component-best-practices)

---

## Analysis Components

### AnalysisSummary

**Purpose**: Main analysis dashboard component that orchestrates all analysis sections.

**Location**: `src/components/analysis/AnalysisSummary.tsx`

**Props**:
```typescript
interface AnalysisSummaryProps {
  reviews: Review[];
  businessName?: string;
  businessType?: BusinessType;
  loading?: boolean;
  config?: AnalysisConfig;
  className?: string;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  customizable?: boolean;
  exportable?: boolean;
}
```

**Features**:
- Executive summary with health scores
- Performance metrics visualization
- Sentiment and thematic analysis
- Staff insights and operational data
- Action items generation
- Modal-based advanced features (Charts, Export, Customizer, etc.)

**Usage Example**:
```tsx
<AnalysisSummary
  reviews={reviewData}
  businessName="The Little Prince Cafe"
  businessType="CAFE"
  exportable={true}
  customizable={true}
  onRefresh={handleDataRefresh}
/>
```

**Performance Optimizations**:
- Memoized analysis calculations
- Lazy loading of modal components
- Optimized re-renders with React.useMemo

---

### InteractiveCharts

**Purpose**: Advanced interactive visualization component with multiple chart types.

**Location**: `src/components/analysis/InteractiveCharts.tsx`

**Props**:
```typescript
interface InteractiveChartsProps {
  reviews: Review[];
  analysisData: AnalysisSummaryData;
  refreshData?: () => void;
  autoRefresh?: boolean;
}
```

**Features**:
- 6 chart types: Line, Area, Bar, Pie, Radar, Scatter
- Interactive controls: zoom, pan, time range selection
- Real-time data updates
- Export capabilities (PNG, SVG, PDF)
- Responsive design with fullscreen mode

**Chart Types**:
- **Line Charts**: Trend analysis over time
- **Area Charts**: Volume visualization with fill
- **Bar Charts**: Category comparisons
- **Pie Charts**: Distribution breakdowns
- **Radar Charts**: Multi-dimensional analysis
- **Scatter Charts**: Correlation analysis

**Performance**: Uses React.memo and optimized rendering for smooth 60fps interactions.

---

### ExportManager

**Purpose**: Comprehensive export system supporting multiple formats and templates.

**Location**: `src/components/analysis/ExportManager.tsx`

**Features**:
- **Export Formats**: PDF, Excel, CSV, JSON
- **Templates**: Executive, Detailed, Minimal, Custom
- **Chart Integration**: Converts interactive charts to images
- **Branding Support**: Custom colors, logos, company branding
- **Section Control**: Granular control over report sections

**Export Templates**:
1. **Executive**: High-level overview for executives
2. **Detailed**: Comprehensive analysis with all data
3. **Minimal**: Essential metrics only
4. **Custom**: User-defined sections and formatting

---

### DashboardCustomizer

**Purpose**: Complete dashboard customization system with templates and layouts.

**Location**: `src/components/analysis/DashboardCustomizer.tsx`

**Features**:
- **Widget Management**: Drag-and-drop interface for reordering
- **Layout Controls**: 1-6 column layouts with responsive breakpoints
- **Theme System**: Light, Dark, Auto with custom color schemes
- **Template Management**: Save, load, and share configurations
- **Real-time Preview**: Live preview of all changes

**Customization Options**:
- Widget selection and ordering
- Column count and spacing
- Color schemes and themes
- Layout templates
- Import/export configurations

---

### AlertSystem

**Purpose**: Real-time performance monitoring with configurable thresholds.

**Location**: `src/components/analysis/AlertSystem.tsx`

**Features**:
- **4 Alert Types**: Rating, sentiment, volume, response rate
- **Severity Levels**: Low, Medium, High, Critical
- **Notification Rules**: Configurable conditions and actions
- **Alert Management**: Acknowledge, filter, and track alerts
- **Email Integration**: Automated notifications

**Alert Types**:
1. **Rating Alerts**: Monitor average rating thresholds
2. **Sentiment Alerts**: Track sentiment score changes
3. **Volume Alerts**: Monitor review volume fluctuations
4. **Response Rate Alerts**: Track owner response metrics

---

### ComparativeAnalysis

**Purpose**: Period comparison system with trend analysis.

**Location**: `src/components/analysis/ComparativeAnalysis.tsx`

**Features**:
- **4 Comparison Modes**: 30-day, 90-day, year-over-year, custom
- **Comprehensive Metrics**: 8+ performance indicators
- **Visual Comparisons**: Interactive charts showing changes
- **Theme Evolution**: Track how topics change over time
- **Staff Performance**: Monitor individual staff trends

**Comparison Periods**:
- 30-day comparison
- 90-day comparison
- Year-over-year analysis
- Custom date ranges

---

### AdvancedFilters

**Purpose**: Multi-category filtering system with presets and export/import.

**Location**: `src/components/analysis/AdvancedFilters.tsx`

**Features**:
- **8 Filter Categories**: Basic, Content, Interaction, Advanced
- **20+ Filter Options**: Comprehensive filtering across all attributes
- **Smart Data Extraction**: Automatic value extraction
- **Filter Presets**: Save and reuse configurations
- **Live Results**: Real-time result updates

**Filter Categories**:
1. **Basic**: Date, rating, sentiment
2. **Content**: Text search, themes, languages
3. **Interaction**: Staff mentions, owner responses
4. **Advanced**: Review length, custom criteria

---

## UI Components

### ErrorBoundary

**Purpose**: React Error Boundary for graceful error handling.

**Location**: `src/components/ErrorBoundary.tsx`

**Types**:
- **PageErrorBoundary**: Page-level error handling
- **SectionErrorBoundary**: Section-level error isolation
- **ComponentErrorBoundary**: Component-level error catching

**Features**:
- Retry functionality with configurable attempts
- User-friendly error messages
- Development error details
- Error reporting integration

---

## Error Handling Components

### AppError Class

**Purpose**: Enhanced error class with categorization and context.

**Location**: `src/utils/errorHandling.ts`

**Error Types**:
- `NETWORK`: Connection issues
- `VALIDATION`: Input validation errors
- `PERMISSION`: Access denied errors
- `NOT_FOUND`: Resource not found
- `SERVER`: Server-side errors
- `CLIENT`: Client-side errors
- `UNKNOWN`: Uncategorized errors

**Severity Levels**:
- `LOW`: Minor issues
- `MEDIUM`: Standard errors
- `HIGH`: Important errors
- `CRITICAL`: System-critical errors

---

## Performance Components

### PerformanceMonitor

**Purpose**: Performance monitoring and measurement utilities.

**Location**: `src/utils/performanceOptimizations.ts`

**Features**:
- Execution time measurement
- Performance statistics (average, min, max, percentiles)
- Memory usage monitoring
- Performance report generation

**Usage**:
```typescript
const stopMeasurement = PerformanceMonitor.startMeasurement('component-render');
// ... component rendering
const duration = stopMeasurement();
```

### Memoization System

**Purpose**: Cache expensive calculations with expiration.

**Features**:
- Configurable cache expiration
- Automatic cleanup of expired entries
- Performance monitoring integration
- Memory optimization

---

## Component Best Practices

### Performance Guidelines

1. **Use React.memo** for components that render frequently
2. **Implement useMemo** for expensive calculations
3. **Use useCallback** for event handlers passed to child components
4. **Lazy load** heavy components with the lazy loading system
5. **Monitor performance** with PerformanceMonitor

### Error Handling Guidelines

1. **Wrap components** with appropriate ErrorBoundary levels
2. **Use safeExecute** for potentially failing operations
3. **Log errors** with proper context using ErrorLogger
4. **Provide fallbacks** for all async operations

### Code Quality Guidelines

1. **Use TypeScript** with strict mode enabled
2. **Follow naming conventions**: PascalCase for components, camelCase for functions
3. **Document complex logic** with comments
4. **Use proper prop types** and interfaces
5. **Handle edge cases** and null/undefined values

### Accessibility Guidelines

1. **Use semantic HTML** elements
2. **Provide ARIA labels** for interactive elements
3. **Ensure keyboard navigation** works properly
4. **Maintain color contrast** ratios
5. **Test with screen readers**

---

## Component Lifecycle

### Loading States

All components should handle loading states gracefully:

```typescript
if (loading) {
  return <LoadingFallback size="medium" message="Loading..." />;
}
```

### Error States

Components should provide meaningful error states:

```typescript
if (error) {
  return <ErrorFallback error={error} retry={handleRetry} />;
}
```

### Empty States

Handle empty data scenarios:

```typescript
if (!data || data.length === 0) {
  return <EmptyState message="No data available" />;
}
```

---

## Testing Guidelines

### Unit Testing

1. Test component rendering with different props
2. Test user interactions and event handlers
3. Test error scenarios and edge cases
4. Mock external dependencies

### Integration Testing

1. Test component interactions
2. Test data flow between components
3. Test error boundary behavior
4. Test performance under load

### Accessibility Testing

1. Test keyboard navigation
2. Test screen reader compatibility
3. Test color contrast ratios
4. Test focus management

---

## Performance Metrics

### Target Performance

- **First Load**: < 2 seconds
- **Component Render**: < 100ms
- **User Interactions**: < 50ms response time
- **Memory Usage**: < 100MB for typical usage

### Monitoring

Use the PerformanceMonitor to track:
- Component render times
- Data processing duration
- Memory usage patterns
- Error frequencies

---

## Migration Guide

### From Legacy Components

1. **Wrap with ErrorBoundary**: Add appropriate error boundaries
2. **Add Performance Monitoring**: Implement performance tracking
3. **Update Props**: Use new TypeScript interfaces
4. **Add Lazy Loading**: Convert to lazy components where appropriate

### Breaking Changes

When updating components, consider:
- Prop interface changes
- Performance optimization impacts
- Error handling requirements
- Accessibility improvements

---

This documentation should be updated whenever components are modified or new components are added. Each component should maintain its own inline documentation using JSDoc comments.
