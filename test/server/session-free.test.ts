import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { SESSION_FREE_PATHS } from '~~/server/utils/sessionCheck'

// The session middleware skips SESSION_FREE_PATHS, so a handler there would
// see a session nobody checked: one that expired, or whose password or role
// changed. This test fails when a handler under those paths reads or writes
// the session. Move the path out of the list instead.
const apiDir = fileURLToPath(new URL('../../server/api', import.meta.url))
const handlerFiles = SESSION_FREE_PATHS.flatMap((prefix) => {
  const dir = join(apiDir, prefix.replace(/^\/api\//, ''))
  return existsSync(dir)
    ? readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter(file => file.endsWith('.ts'))
      .map(file => join(prefix, file))
    : []
}).sort()

describe('session-free API handlers', () => {
  it('finds the handlers', () => {
    expect(handlerFiles.length).toBeGreaterThan(0)
  })

  it.each(handlerFiles)('%s does not use the session', (file) => {
    const source = readFileSync(join(apiDir, file.replace(/^\/api\//, '')), 'utf8')
    expect(source).not.toMatch(/\b(get|require|set|replace|clear)UserSession\b|requireAdminSession|useSession\(/)
  })
})
