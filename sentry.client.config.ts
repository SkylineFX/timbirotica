import * as Sentry from "@sentry/nuxt";
import { useRuntimeConfig } from "#imports";
import { SENTRY_DATA_COLLECTION } from "./shared/constants/sentry";

Sentry.init({
  // Only send events from production builds — keeps localhost/dev noise out of the dashboard.
  enabled: import.meta.env.PROD,

  // "preview" on Worker Previews (NUXT_PUBLIC_SENTRY_ENVIRONMENT in nuxt.config.ts),
  // so errors from staging don't show up as production.
  environment: useRuntimeConfig().public.sentryEnvironment,

  // If set up, you can use your runtime config here
  // dsn: useRuntimeConfig().public.sentry.dsn,
  dsn: "https://0eeb62d30c982bd85cc7ba6e7a4599ca@o4511418226114560.ingest.de.sentry.io/4511418227884112",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 0.2,

  // Only what the privacy policy describes (shared/constants/sentry.ts).
  dataCollection: SENTRY_DATA_COLLECTION,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
