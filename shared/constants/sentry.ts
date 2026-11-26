import type { DataCollection } from '@sentry/core'

/**
 * What Sentry may collect, in the browser (sentry.client.config.ts) and in the
 * Worker (server/plugins/sentry.ts). Sentry 11 collects everything unless told
 * otherwise, including cookies, request and response bodies and user details.
 * This keeps what Sentry 10 collected with sendDefaultPii off, as the privacy
 * policy describes: no user details, cookies, bodies or database queries, and
 * headers and query parameters without addresses or user names.
 * Values from Sentry's v10 to v11 migration guide.
 */
export const SENTRY_DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] }
  },
  httpBodies: [],
  urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false }
}
