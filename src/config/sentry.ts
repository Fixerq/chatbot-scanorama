
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import type { Integration } from '@sentry/types';

const initSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not found');
    return;
  }

  const integrations: Integration[] = [new BrowserTracing()];

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations,
    tracesSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
};

export default initSentry;
