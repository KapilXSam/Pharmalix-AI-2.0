import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong.</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2 mb-6">This part of the application has encountered an unexpected error.</p>
            <button
                onClick={this.handleReset}
                className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors"
            >
                Return to Dashboard
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
