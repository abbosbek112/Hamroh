/**
 * =========================================================================================
 * 🛡️ PRODUCTION-SAFE LOGGER
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - Disables all logs in production (prevents sensitive data leaks)
 * - Errors are always logged (for debugging)
 * - Debug logs only in development with VITE_DEBUG=true
 * 
 * USAGE:
 * - logger.log() - Development only
 * - logger.warn() - Development only
 * - logger.error() - Always logged (consider error tracking service)
 * - logger.debug() - Development + VITE_DEBUG=true
 * - logger.info() - Development only
 * 
 * TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
 * =========================================================================================
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log information (only in development)
   */
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, sent to Sentry in production)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
    if (!isDevelopment) {
      import('@sentry/react').then(({ captureException }) => {
        const err = args[0] instanceof Error ? args[0] : new Error(String(args[0] ?? 'Unknown error'));
        captureException(err, { extra: { args: args.slice(1) } });
      }).catch(() => {});
    }
  },

  /**
   * Debug logs (only in development, more verbose)
   */
  debug: (...args: any[]): void => {
    if (isDevelopment && import.meta.env.VITE_DEBUG === 'true') {
      console.debug(...args);
    }
  },

  /**
   * Info logs (always logged, but formatted)
   */
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
};
