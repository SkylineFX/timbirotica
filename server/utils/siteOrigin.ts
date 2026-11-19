import type { H3Event } from 'h3'

/**
 * Origin for links in emails, such as password-reset and email-confirmation
 * links. It comes from runtimeConfig.public.siteUrl, not from the request's
 * Host header, so a link that carries a token always points at the shop.
 *
 * In `nuxt dev` the request's own origin is used instead, so links work on
 * localhost, a LAN address or a tunnel.
 */
export function siteOrigin(event: H3Event): string {
  if (import.meta.dev) return getRequestURL(event).origin
  return new URL(useRuntimeConfig(event).public.siteUrl).origin
}
