// The Content-Security-Policy for pages, sent as Content-Security-Policy-Report-Only
// for now: browsers report what it would block in the console and block
// nothing. server/plugins/securityHeaders.ts sends it with a new nonce for
// every page and puts that nonce on the page's own scripts.
//
// What the pages load:
// - scripts: the app bundle from this site; inline scripts from Nuxt (the
//   runtime config) and from Cloudflare's bot detection, which takes the
//   nonce from this header; Turnstile from challenges.cloudflare.com; the
//   image error handler below. No eval. Zod tries new Function once per page
//   load to see whether it may compile its parsers, so every page shows one
//   expected eval violation from zod. When eval is blocked, Zod catches the
//   error and uses its plain parser, the same one it uses in the Worker.
// - frames: Turnstile, and the Google Maps embed on /despre-noi.
// - images: this site, the product CDN, the placehold.co fallback in the cart,
//   and data: URLs for the icons.
// - requests: this site (including Cloudflare's /cdn-cgi/ paths) and Sentry.
// Styles stay 'unsafe-inline': Nuxt UI and the components set inline styles.

const SENTRY_INGEST = 'https://o4511418226114560.ingest.de.sentry.io'

/**
 * NuxtImg puts onerror="this.setAttribute('data-error', 1)" on every image
 * rendered on the server, so an image that fails before the page hydrates
 * still counts as failed. 'unsafe-hashes' with this hash allows exactly that
 * handler and no other inline handler. The test checks it against
 * @nuxt/image.
 */
export const NUXT_IMG_ONERROR_HASH = 'sha256-bwK6T5wZVTANitXbrTsel7kl/PyCjCd/Dq5Qoz3imjM='

/** A random nonce for one page response. */
export function createCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
}

export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-hashes' '${NUXT_IMG_ONERROR_HASH}' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://cdn.timbirotica.ro https://placehold.co",
    `connect-src 'self' ${SENTRY_INGEST}`,
    "frame-src 'self' https://challenges.cloudflare.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ].join('; ')
}

/**
 * Puts the nonce on every script tag in a piece of page HTML. Only the parts
 * Nuxt builds from head tags go through here, never the rendered page body,
 * so a script that got into page content stays without a nonce.
 */
export function addScriptNonce(html: string, nonce: string): string {
  return html.replace(/<script(?=[\s>])/gi, `<script nonce="${nonce}"`)
}
