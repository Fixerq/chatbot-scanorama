
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
};

export default initSentry;
