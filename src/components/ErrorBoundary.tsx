
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as Sentry from '@sentry/browser';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    Sentry.captureException(error, { 
      extra: { 
        componentStack: errorInfo.componentStack,
        ...errorInfo
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
