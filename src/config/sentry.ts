
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import type { Integration } from '@sentry/types';

const initSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not found');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing() as unknown as Integration],
    tracesSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
};

export default initSentry;
