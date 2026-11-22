import { isCrossOriginWrite } from '../utils/originCheck'

// Refuses POST, PUT, PATCH and DELETE requests sent from a page on another
// host (see server/utils/originCheck.ts). It runs before session.ts, so a
// refused request doesn't read the session from the database.
export default defineEventHandler((event) => {
  const refused = isCrossOriginWrite({
    method: event.method,
    origin: getRequestHeader(event, 'origin'),
    host: getRequestHeader(event, 'host')
  })
  if (refused) throw createError({ statusCode: 403, message: 'Cererea nu este permisa.' })
})
