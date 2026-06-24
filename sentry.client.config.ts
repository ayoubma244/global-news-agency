import { withSentryConfig } from '@sentry/nextjs'
import nextConfig from './next.config'

export default withSentryConfig(nextConfig, {
  // Only include Sentry in production builds
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Auth token for source map uploads
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Tree-shake Sentry in development
  reactComponentAnnotation: {
    enabled: true,
  },
  // Hide source maps
  hideSourceMaps: true,
  // Disable in development
  disableLogger: true,
})
