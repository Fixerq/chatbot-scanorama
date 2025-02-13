
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorFallback = ({ error, resetError }: { error: Error, resetError: () => void }) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    resetError();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || 'An unexpected error occurred during authentication.'}
        </AlertDescription>
        <Button 
          variant="outline" 
          className="mt-4 w-full"
          onClick={handleRetry}
        >
          Try Again
        </Button>
      </Alert>
    </div>
  );
};

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error!} 
          resetError={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }

    return this.props.children;
  }
}
