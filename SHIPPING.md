# Shipping checklist

Run through this list before every production deploy. Most items are one-time setup; some need re-verification per deploy (marked **EVERY DEPLOY**).

---

## 1. Environment variables (production)

All required on the host (NuxtHub dashboard, Cloudflare Workers secret, or your `.env.production`):

| Variable | What | How to generate / get |
|---|---|---|
| `NUXT_SESSION_PASSWORD` | Encrypts session cookies. **Must be ≥32 chars, random, never the dev value.** If leaked, any user session can be forged. | `openssl rand -base64 48` |
| `RESEND_API_KEY` | Sends order, verification, reset emails. Dev keys only deliver to verified test addresses — prod keys are tied to your verified sending domain. | Resend dashboard → API keys → create for prod domain |
| `NODE_ENV` | Must be `production` so `secure: true` cookie flag turns on (see `nuxt.config.ts`). | Set by host automatically in most cases — verify. |

DB URL is auto-provisioned by NuxtHub (Cloudflare D1). If self-hosting, set the libSQL/Turso URL.

**Verification — EVERY DEPLOY:**
- After deploying, open Resend logs and confirm a verification email actually goes out (register a test account).
- Inspect the email link — it must point to your real domain, not `localhost` or an internal hostname. If it's wrong, your proxy/CDN isn't forwarding the right `Host` header; configure `X-Forwarded-Host` or hardcode origin.

---

## 2. Smoke test on staging or canary

Walk every golden path before promoting to prod. Use a real phone alongside the browser.

- [ ] Register account → confirmation email arrives → click link → "Adresa de email confirmata" page renders
- [ ] Forgot password → email arrives → reset link works → log in with new password
- [ ] Log in → log out → log in again
- [ ] Browse categories, brand pages, recommended; filter (price, availability, sub, brand); pagination; sort
- [ ] Search with and without diacritics (e.g. `hârtie` should match `HARTIE`)
- [ ] Add product to cart, change quantity, remove
- [ ] Add billing/shipping addresses, edit, delete
- [ ] Checkout with `transfer` payment + courier delivery (terms checkbox must be required)
- [ ] Checkout with `cash` payment + pickup
- [ ] Order confirmation email arrives with proforma PDF attached
- [ ] `/user/comenzi` shows the order; click "Detalii"; reorder; cancel
- [ ] Download proforma manually from order detail
- [ ] Admin: view orders list, filter by status, change status, edit a product price/stock
- [ ] Visit `/this-does-not-exist` — custom 404 renders with working buttons (full page reload, not just URL change)
- [ ] Visit `/comenzi` (old URL) — 301 redirect to `/user/comenzi`

---

## 3. Operational safety nets

- [ ] **Error monitoring** — Sentry / LogRocket / equivalent wired up. Without this, prod bugs are invisible until customers complain.
- [ ] **Database backups** — daily snapshots, ≥14 day retention. **Verify a restore actually works** before you need it.
- [ ] **Weekly stock/price sync cron** scheduled (`npx tsx scripts/update-product-prices-stock.ts`). Add a `lastSyncedAt` table or log so silently-failed syncs are visible.
- [ ] **Cloudflare bot mitigation** enabled on the origin to cover the auth endpoints we deliberately don't rate-limit at the app layer.

---

## 4. SEO + analytics (day-one)

- [ ] `robots.txt` allows crawlers on public routes, disallows `/user/*`, `/admin/*`, `/checkout`, `/cautare`
- [ ] Sitemap generated (consider `@nuxtjs/sitemap`)
- [ ] Privacy-friendly analytics in place (Plausible, Umami, Cloudflare Web Analytics)
- [ ] Open Graph / Twitter card meta on product + category pages (currently only `title` + `description` are set)

---

## 5. Legal / compliance — already done

These have been implemented; verify they still work after deploy:

- [x] Cookie banner (strictly-necessary cookies only, single "Am inteles" button)
- [x] Privacy policy at `/politica-de-confidentialitate` (GDPR section, retention periods, deletion procedure)
- [x] Terms and conditions at `/termeni-si-conditii`
- [x] Terms acceptance checkbox at checkout (required, links to both docs)
- [x] Romanian-language 404 / 500 pages

---

## 6. Known deliberate trade-offs

Things that look like gaps but are intentional given the current model. Document anyway so they don't get "fixed" by accident later.

- **`products.stock` is binary (0/1)**, populated from the weekly supplier scrape. The order endpoint does NOT decrement after a sale — that would corrupt the next sync. Stock is an availability flag from upstream, not an inventory count.
- **No idempotency key on `/api/orders`**. A network retry could theoretically create duplicate orders. Acceptable because no payment is captured at checkout; admin can cancel the duplicate manually.
- **Email verification is not enforced** before browsing/adding to cart. It IS required at checkout (`/api/orders` returns 403 without `emailVerifiedAt`).
- **No app-level rate limits** on login/register/forgot-password. Cloudflare handles bot mitigation at the edge instead, avoiding legitimate-user lockouts.
- **No diacritics in UI / product names / category names** by design. Search normalizes diacritics on the query side so `hârtie` still matches `HARTIE`.
- **Email content keeps diacritics** (templates in `app/emails/` and subject lines in `server/utils/email.ts`).

---

## 7. After deploy — sanity checks

- [ ] Hit homepage, check no console errors
- [ ] Place one real test order with a real email
- [ ] Check the order arrives in admin
- [ ] Check the proforma email + attachment lands correctly in inbox (not spam)
- [ ] Click around the 404 / error recovery flow
- [ ] Verify HTTPS, no mixed-content warnings
