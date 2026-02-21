/**
 * =========================================================================================
 * 🚀 APPLICATION ENTRY POINT
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - Error boundary for crash prevention
 * - Context providers for global state
 * - Proper root element validation
 * - Sentry error tracking in production
 * 
 * ARCHITECTURE:
 * - React.StrictMode for development warnings
 * - ErrorBoundary catches all React errors
 * - LanguageProvider for i18n
 * - ToastProvider for notifications
 * - AudioProvider for global audio management
 * =========================================================================================
 */

import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AudioProvider } from './contexts/AudioContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initObservability } from './utils/observability';
import { initAnalytics } from './utils/analytics';
import './src/index.css';

initObservability();
initAnalytics();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement, {
  onUncaughtError: Sentry.reactErrorHandler((error) => {
    console.error('Uncaught error:', error);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
});
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AudioProvider>
            <App />
          </AudioProvider>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
