/**
 * Sentry initialization for error tracking.
 * Set SENTRY_DSN in env to enable.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

export function initSentry() {
  if (!SENTRY_DSN) return

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || '2.0.0',
    integrations: [
      Sentry.httpIntegration(),
      Sentry.prismaIntegration(),
    ],
    ignoreErrors: [
      // Common noise
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],
    beforeSend(event) {
      // Filter out errors from admin actions in dev
      if (process.env.NODE_ENV === 'development' && event.request?.url?.includes('/admin')) {
        return null
      }
      return event
    },
  })
}

export function isSentryConfigured(): boolean {
  return !!SENTRY_DSN
}

export { Sentry }
