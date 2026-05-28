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
    '@sentry/nuxt/module'
  ],

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
    resendApiKey: process.env.RESEND_API_KEY,
    adminEmail: process.env.NUXT_ADMIN_EMAIL || 'eurotimalex@yahoo.com',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
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

  colorMode: {
    preference: 'light'
  },

  routeRules: {
    '/comenzi': { redirect: { to: '/user/comenzi', statusCode: 301 } }
  },

  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com', '.ngrok.io', '.ngrok-free.app']
    }
  },

  sentry: {
    org: 'eurotimalex-et',
    project: 'javascript-nuxt'
  },

  sourcemap: {
    client: 'hidden'
  }
})