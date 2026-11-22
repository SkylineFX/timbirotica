// Cross-site request protection on top of the SameSite=Lax session cookie.
// SameSite treats every timbirotica.ro subdomain as the same site, so a page
// served from cdn.timbirotica.ro (an HTML or SVG file in the bucket) could
// send writes with the shopper's cookie. Browsers name the page that sent a
// request in the Origin header, and server/middleware/origin.ts refuses
// writes whose Origin is another host.

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * True for a write request sent from a page on another host. Requests
 * without an Origin header (curl, servers, old browsers) pass: they don't
 * carry a browser's cookies to another site's page. "null", which sandboxed
 * frames and data: URLs send, counts as another host. Only the host is
 * compared, so http and https on the same host count as the same page.
 */
export function isCrossOriginWrite(
  { method, origin, host }: { method: string; origin: string | undefined; host: string | undefined }
): boolean {
  if (!WRITE_METHODS.has(method.toUpperCase())) return false
  if (origin === undefined) return false
  if (!host) return true
  try {
    return new URL(origin).host !== host.toLowerCase()
  } catch {
    return true
  }
}
