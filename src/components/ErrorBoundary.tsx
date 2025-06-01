/**
 * Error Boundary Component - Phase 5
 * 
 * React Error Boundary to catch JavaScript errors anywhere in the component tree,
 * log those errors, and display a fallback UI instead of crashing the whole app.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  MessageCircle 
} from 'lucide-react';
import { 
  ErrorBoundaryState, 
  ErrorBoundaryError, 
  logError, 
  ErrorSeverity 
} from '@/utils/errorHandling';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // If true, only isolate this boundary, don't crash parent
  level?: 'page' | 'section' | 'component';
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | undefined;
  resetError: () => void;
  level: 'page' | 'section' | 'component';
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const boundaryError = new ErrorBoundaryError(error.message, error);
    
    // Log the error using the standalone logError function
    logError(boundaryError, `ErrorBoundary-${this.props.level || 'component'}`);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Store error info in state
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.retryCount++;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, level = 'component' } = this.props;
      
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error!}
            errorInfo={this.state.errorInfo}
            resetError={this.handleReset}
            level={level}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.handleReset}
          level={level}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  retryCount: number;
  maxRetries: number;
  onReload: () => void;
  onGoHome: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  level,
  retryCount,
  maxRetries,
  onReload,
  onGoHome
}: DefaultErrorFallbackProps) {
  const canRetry = retryCount < maxRetries;
  
  const getErrorTitle = () => {
    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      default:
        return 'Component Error';
    }
  };

  const getErrorDescription = () => {
    switch (level) {
      case 'page':
        return 'An error occurred while loading this page. You can try refreshing the page or return to the home page.';
      case 'section':
        return 'An error occurred in this section. You can try refreshing this section or continue using other parts of the application.';
      default:
        return 'An error occurred in this component. You can try refreshing this component or continue using the application.';
    }
  };

  const getErrorActions = () => {
    const actions = [];

    if (canRetry && level !== 'page') {
      actions.push(
        <Button
          key="retry"
          onClick={resetError}
          variant="default"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      );
    }

    if (level === 'page' || !canRetry) {
      actions.push(
        <Button
          key="reload"
          onClick={onReload}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </Button>
      );
    }

    actions.push(
      <Button
        key="home"
        onClick={onGoHome}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Go Home
      </Button>
    );

    return actions;
  };

  const containerClass = level === 'page' 
    ? 'min-h-screen flex items-center justify-center p-4'
    : level === 'section'
    ? 'min-h-[300px] flex items-center justify-center p-4'
    : 'min-h-[200px] flex items-center justify-center p-2';

  return (
    <div className={containerClass}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {getErrorTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getErrorDescription()}
            </AlertDescription>
          </Alert>

          {retryCount > 0 && (
            <Alert>
              <AlertDescription>
                Retry attempt {retryCount} of {maxRetries}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {getErrorActions()}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer flex items-center gap-2 font-medium">
                <Bug className="h-4 w-4" />
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error?.message || 'Unknown error'}
                {'\n\n'}
                {error?.stack || 'No stack trace available'}
                {errorInfo && (
                  <>
                    {'\n\nComponent Stack:'}
                    {errorInfo.componentStack || 'No component stack available'}
                  </>
                )}
              </pre>
            </details>
          )}

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const subject = encodeURIComponent(`Error Report: ${error?.message || 'Unknown error'}`);
                const body = encodeURIComponent(
                  `Error occurred in ${level}:\n\n` +
                  `Message: ${error?.message || 'Unknown error'}\n` +
                  `Stack: ${error?.stack || 'No stack trace'}\n` +
                  `Component Stack: ${errorInfo?.componentStack || 'No component stack'}\n` +
                  `User Agent: ${navigator.userAgent}\n` +
                  `URL: ${window.location.href}\n` +
                  `Timestamp: ${new Date().toISOString()}`
                );
                window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
              }}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Report Error
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Higher-order component to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook to programmatically trigger error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return React.useCallback((error: Error) => {
    setError(error);
  }, []);
}

// Async error boundary hook
export function useAsyncError() {
  const throwError = useErrorHandler();

  return React.useCallback((error: Error) => {
    // Log async error
    logError(error, 'AsyncError');
    
    // Throw to nearest error boundary
    throwError(error);
  }, [throwError]);
}

// Component-level error boundary for specific components
export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

// Section-level error boundary
export const SectionErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="section">
    {children}
  </ErrorBoundary>
);

// Page-level error boundary  
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
