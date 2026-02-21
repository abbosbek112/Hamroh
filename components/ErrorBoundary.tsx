/**
 * =========================================================================================
 * 🛡️ ERROR BOUNDARY COMPONENT
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - Catches all React component errors
 * - Prevents app crashes
 * - Shows user-friendly error messages
 * - Logs errors for debugging
 * - Hides technical details in production
 * 
 * USAGE:
 * - Wrap root App component
 * - Catches errors in component tree
 * - Provides recovery options
 * =========================================================================================
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare state: Readonly<State>;
  declare props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    (this as Component<Props, State>).setState({
      error,
      errorInfo,
    });
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  handleReset = () => {
    // Update state using Component's setState
    (this as Component<Props, State>).setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Optionally reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#050505] dark:to-[#0a0a0c] p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1a1e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={40} />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Xatolik yuz berdi
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Kechirasiz, kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Texnik ma'lumotlar (Development)
                </summary>
                <div className="mt-2 p-3 bg-slate-50 dark:bg-black/20 rounded-lg overflow-auto max-h-40 text-xs font-mono text-red-600 dark:text-red-400">
                  <div className="font-bold mb-1">Error:</div>
                  <div>{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold mt-2 mb-1">Stack:</div>
                      <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Qayta urinish
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Bosh sahifa
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
