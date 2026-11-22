import { addScriptNonce, contentSecurityPolicy, createCspNonce } from '../utils/contentSecurityPolicy'

// Page response headers. The headers for every response are route rules in
// nuxt.config.ts.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    // The head and the scripts before </body> are Nuxt's own tags. The page
    // body (html.body, html.bodyPrepend) is left alone.
    const nonce = createCspNonce()
    event.context.cspNonce = nonce
    html.head = html.head.map(chunk => addScriptNonce(chunk, nonce))
    html.bodyAppend = html.bodyAppend.map(chunk => addScriptNonce(chunk, nonce))
  })

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    // Nuxt names itself on every page; nothing needs it.
    delete response.headers?.['x-powered-by']

    const nonce = event.context.cspNonce
    if (nonce && response.headers) {
      response.headers['content-security-policy-report-only'] = contentSecurityPolicy(nonce)
    }
  })
})
