import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins'
import { SENTRY_DATA_COLLECTION } from '~~/shared/constants/sentry'

// Server-side Sentry for the Cloudflare Worker. sentry.server.config.ts only
// runs on Node (it must be preloaded at start-up), so the Worker never started
// Sentry and every Sentry.captureException call on the server did nothing.
// This plugin starts it per request instead, as Sentry's Nuxt-on-Cloudflare
// guide describes. It needs the nodejs_compat flag, which the Worker has.
export default defineNitroPlugin(
  sentryCloudflareNitroPlugin(() => ({
    // Only send events from production builds, like sentry.client.config.ts.
    // In `nuxt dev` the plugin also sees no Cloudflare request and stays idle.
    enabled: !import.meta.dev,

    dsn: 'https://0eeb62d30c982bd85cc7ba6e7a4599ca@o4511418226114560.ingest.de.sentry.io/4511418227884112',

    // Worker Previews set SENTRY_ENVIRONMENT=preview (nitro.cloudflare.wrangler
    // .previews.vars), so staging errors don't show up as production. The options
    // are read per request, after Cloudflare has made the Worker's vars available.
    environment: process.env.SENTRY_ENVIRONMENT || 'production',

    // Errors only. Tracing would add CPU time to every request and send spans for
    // bots and the uptime check; turn it on with tracesSampleRate if needed.

    // Only what the privacy policy describes.
    dataCollection: SENTRY_DATA_COLLECTION
  }))
)
