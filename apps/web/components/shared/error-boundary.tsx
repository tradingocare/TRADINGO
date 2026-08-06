'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { captureError } from '@/lib/monitoring/sentry';
import { ErrorState } from './error-state';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureError(error, { boundary: 'ErrorBoundary', componentStack: errorInfo.componentStack ?? '' });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorState
          error={this.state.error ?? undefined}
          reset={this.handleRetry}
          title="Something went wrong"
          message="An unexpected error occurred in this section."
          showHome={false}
        />
      );
    }
    return this.props.children;
  }
}
