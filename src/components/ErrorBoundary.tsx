import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-[#F5A623] mx-auto mb-3" />
            <h2 className="text-white font-semibold text-lg mb-1">Something went wrong</h2>
            <p className="text-white/40 text-sm mb-4">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
