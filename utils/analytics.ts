import posthog from 'posthog-js';

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    autocapture: true,
    capture_pageview: true,
    disable_session_recording: true,
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        // In dev we keep it quiet by default
        ph.debug(false);
      }
    },
  });
}

