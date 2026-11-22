// Page response headers. The headers for every response are route rules in
// nuxt.config.ts.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    // Nuxt names itself on every page; nothing needs it.
    delete response.headers?.['x-powered-by']
  })
})
