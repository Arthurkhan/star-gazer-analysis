import React, { Component, ErrorInfo, ReactNode } from 'react';
import { appDebugger } from '@/utils/debugger';
import { toast } from '@/hooks/use-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our monitoring system
    appDebugger.error('React component error boundary caught error:', {
      error,
      componentStack: errorInfo.componentStack
    });
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Notify the user
    toast({
      title: 'Application Error',
      description: 'An error occurred in the application. Our team has been notified.',
      variant: 'destructive'
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800 max-w-md mx-auto my-8">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            Component Error
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Something went wrong in this section of the application.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;