import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// The admin middleware matches on the request path, and a path check can be
// slipped past (an encoded path such as /api/%61dmin/orders once did exactly
// that). So every admin handler must also check the role itself. This test
// fails when a handler under server/api/admin does not.
const adminDir = fileURLToPath(new URL('../../server/api/admin', import.meta.url))
const handlerFiles = readdirSync(adminDir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts'))
  .sort()

describe('admin API handlers', () => {
  it('finds the admin handlers', () => {
    expect(handlerFiles.length).toBeGreaterThan(0)
  })

  it.each(handlerFiles)('%s calls requireAdminSession', (file) => {
    const source = readFileSync(join(adminDir, file), 'utf8')
    expect(source).toMatch(/await requireAdminSession\(event\)/)
  })
})
