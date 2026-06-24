import { withSentryConfig } from '@sentry/nextjs'
import nextConfig from './next.config'

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  hideSourceMaps: true,
})
