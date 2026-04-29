// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@nuxthub/core',
    '@nuxt/image',
    'nuxt-email-renderer'
  ],
  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    //!! remove whole session section 
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
    db: 'sqlite'
  },
  colorMode: {
    preference: 'light'
  }
})