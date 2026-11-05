import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // If it's a MetaMask or external browser extension error, ignore it
    const msg = error?.message || '';
    const stack = error?.stack || '';
    if (
      msg.includes('MetaMask') || 
      msg.includes('chrome-extension://') || 
      stack.includes('chrome-extension://') ||
      stack.includes('inpage.js')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error?.message || '';
    const stack = error?.stack || '';
    if (
      msg.includes('MetaMask') || 
      msg.includes('chrome-extension://') || 
      stack.includes('chrome-extension://') ||
      stack.includes('inpage.js')
    ) {
      // Silently swallow third-party extension errors
      return;
    }
    console.warn('Caught by React ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#161b22] border border-rose-500/30 rounded-xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Application Recovered</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected client runtime issue was caught and contained. Click below to refresh the console.
            </p>
            {this.state.error && (
              <div className="p-3 bg-black/40 rounded border border-slate-800 text-left font-mono text-[11px] text-rose-300 break-all max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
