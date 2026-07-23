import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error('[ErrorBoundary] Caught a rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-muted/30">
          <Card className="max-w-md w-full border-destructive/20 shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground text-sm mb-6 text-balance">
                An unexpected error occurred while rendering this component. Our team has been notified.
              </p>
              
              {import.meta.env?.DEV && this.state.error && (
                <div className="bg-slate-950 rounded-md p-4 w-full overflow-auto mb-6 text-left">
                  <p className="text-red-400 font-mono text-xs whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <Button 
                onClick={this.handleReset}
                className="bg-[#FBBF24] hover:bg-[#F59E0B] text-black w-full"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;