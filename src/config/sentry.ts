
import * as Sentry from '@sentry/browser';

const SENTRY_SAMPLE_RATE = 0.1; // Only send 10% of errors
const ERROR_THROTTLE_DURATION = 1000; // Minimum time between error reports

let lastErrorTime = 0;

export const initializeSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not found');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: SENTRY_SAMPLE_RATE,
    beforeSend(event) {
      const now = Date.now();
      if (now - lastErrorTime < ERROR_THROTTLE_DURATION) {
        return null; // Drop the error if we're sending too many
      }
      lastErrorTime = now;
      return event;
    },
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/yourapp\.com/],
      }),
    ],
  });
};
