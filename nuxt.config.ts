// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@nuxthub/core',
    '@nuxt/image',
    'nuxt-email-renderer',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@nuxtjs/turnstile',
    '@sentry/nuxt/module'
  ],

  // Cloudflare Turnstile site key (public). Secret key is read from
  // NUXT_TURNSTILE_SECRET_KEY automatically by the module.
  turnstile: {
    siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://timbirotica.ro',
    name: 'Timbirotica'
  },

  robots: {
    disallow: [
      '/admin',
      '/user',
      '/checkout',
      '/comanda-finalizata',
      '/cautare',
      '/api'
    ]
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**', '/user/**', '/checkout', '/comanda-finalizata', '/cautare']
  },

  runtimeConfig: {
    resendApiKey: '',
    adminEmail: process.env.NUXT_ADMIN_EMAIL || 'eurotimalex@yahoo.com',
    // Prepended to every email subject. Set to "[TEST] " on previews (see nitro.cloudflare.wrangler.previews).
    emailSubjectPrefix: '',
    public: {
      // Base of the links in password-reset and email-confirmation emails
      // (server/utils/siteOrigin.ts). Not secret, so it can be read at build
      // time; previews set NUXT_PUBLIC_SITE_URL at run time.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://timbirotica.ro',
    },
    session: {
      // Read from NUXT_SESSION_PASSWORD at run time. Don't read process.env
      // here: that runs at build time and writes the secret into the bundle.
      password: '',
      // h3 also accepts a sealed session from an x-nuxt-session-session
      // header. The app doesn't use it, and server/middleware/session.ts only
      // checks sessions that come in a cookie.
      sessionHeader: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Allow cookies over HTTP in dev (for LAN testing)
      }
    }
  },

  nuxtEmailRenderer: {
    emailsDir: process.cwd() + '/app/emails'
  },

  css: ['~/assets/main.css'],

  hub: {
    // driver omitted on purpose: @nuxthub/core auto-resolves to 'd1' in the
    // Cloudflare production build and to local libsql (.data/db/sqlite.db) in dev.
    db: {
      dialect: 'sqlite',
      connection: { databaseId: '27d55403-b147-4c49-a203-cb48aad26355' }
    }
  },

  nitro: {
    cloudflare: {
      wrangler: {
        name: 'timbirotica',
        workers_dev: false,
        preview_urls: true,
        // Workers Logs: keep console output, errors and invocation logs for 7 days
        // (Workers > timbirotica > Observability). Set here, not in the dashboard,
        // so a Workers Builds deploy can't turn it back off.
        observability: {
          enabled: true,
          head_sampling_rate: 1
        },
        // Previews (staging): Workers Builds builds every branch other than master
        // with `wrangler preview`. Previews don't inherit production settings, so
        // they get their own database and test settings here and never touch
        // production data. Their secrets are NUXT_SESSION_PASSWORD (must differ
        // from production), NUXT_RESEND_API_KEY and NUXT_OAUTH_GOOGLE_CLIENT_ID /
        // _SECRET. A new preview copies them from the base config, set with
        // `npx wrangler preview base-config secret put <NAME>`. Changing the base
        // config doesn't reach a preview that already exists, even after a
        // rebuild. Set it on that preview too:
        // `npx wrangler preview secret put <NAME> --name <branch> --worker-name timbirotica`.
        // @ts-expect-error `previews` is newer than the Wrangler types bundled with Nitro; Nitro copies it into the generated wrangler.json unchanged.
        previews: {
          d1_databases: [
            {
              binding: 'DB',
              database_name: 'timbirotica-staging',
              database_id: '6a95ada0-a2c4-436b-a36e-c4a2c7b8a45b'
            }
          ],
          vars: {
            // Resend's test inbox: accepted and discarded, visible in the Resend dashboard.
            NUXT_ADMIN_EMAIL: 'delivered@resend.dev',
            // Marks every email sent from a preview as a test.
            NUXT_EMAIL_SUBJECT_PREFIX: '[TEST] ',
            // Cloudflare's public Turnstile test keys: the check always passes on preview hostnames.
            NUXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
            NUXT_TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
            // Labels server errors from previews in Sentry (read in server/plugins/sentry.ts).
            SENTRY_ENVIRONMENT: 'preview',
            // Links in emails sent from a preview open the preview, not the live site.
            // Every preview so far is built from the `staging` branch.
            NUXT_PUBLIC_SITE_URL: 'https://staging-timbirotica.rrstudor.workers.dev'
          }
        }
      }
    }
  },

  ui: {
    colorMode: false
  },

  // Pre-bundle only the icons actually used in the app and @nuxt/ui at build time.
  // Without this, @nuxt/icon defaults to `serverBundle: 'remote'` on Cloudflare
  // Workers, downloading and JSON.parsing ~600 KB icon sets from cdn.jsdelivr.net
  // on cold starts (~250-500 ms of Worker CPU time per request).
  icon: {
    provider: 'iconify',
    serverBundle: false,
    clientBundle: {
      scan: {
        globInclude: [
          'app/**/*.{vue,ts,js}',
          'shared/**/*.{vue,ts,js}',
          'node_modules/@nuxt/ui/dist/**/*.{js,mjs,vue}'
        ],
        globExclude: ['dist', 'build', 'coverage', 'test', 'tests']
      }
    }
  },

  routeRules: {
    // Security headers on every response from the Worker. Only this site may
    // show its pages in a frame (clickjacking), which also lets the Nuxt
    // devtools panel open in dev. The full Content-Security-Policy for pages
    // is in server/plugins/securityHeaders.ts. Strict-Transport-Security is
    // set in Cloudflare (SSL/TLS > Edge Certificates); previews on workers.dev
    // get it from the .dev domain.
    '/**': {
      headers: {
        'Content-Security-Policy': "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    },
    '/comenzi': { redirect: { to: '/user/comenzi', statusCode: 301 } }
  },

  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com', '.ngrok.io', '.ngrok-free.app']
    }
  },

  sentry: {
    org: 'timbirotica',
    project: 'javascript-nuxt'
  },

  sourcemap: {
    client: 'hidden'
  }
})