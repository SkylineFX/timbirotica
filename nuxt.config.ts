// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@nuxthub/core',
    '@nuxt/image'
  ],
  css: ['~/assets/main.css'],
  hub: {
    db: 'sqlite'
  },
  colorMode: {
    preference: 'light'
  }
})