import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../server/db/schema'
import { eq } from 'drizzle-orm'
import { readFile, writeFile } from 'fs/promises'
import { existsSync, readdirSync, statSync } from 'fs'
import { basename, join, resolve } from 'path'

interface JsonEntry {
  category?: string
  subcategory?: string
  sku?: string
  name?: string
  url?: string
  image_url?: string
  price?: string | number
  stock_status?: string
}

const STOCK_MAP: Record<string, number> = {
  'in stoc': 1,
  'stoc limitat': 1,
  'produs momentan indisponibil': 0,
  'nu este in stoc': 0,
}

const dryRun = process.argv.includes('--dry-run')

function resolveInputPath(): string {
  const fileArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (fileArg) {
    if (existsSync(fileArg)) return resolve(fileArg)
    const inDataDir = join(process.cwd(), 'scripts', 'data', fileArg)
    if (existsSync(inDataDir)) return inDataDir
    throw new Error(`File not found: "${fileArg}" (checked "${resolve(fileArg)}" and "${inDataDir}")`)
  }

  // 1. Auto-pick newest listings_*.json in scripts/data/
  const dataDir = join(process.cwd(), 'scripts', 'data')
  if (existsSync(dataDir)) {
    const listingsFiles = readdirSync(dataDir)
      .filter((f) => f.startsWith('listings_') && f.endsWith('.json'))
      .map((f) => ({ name: f, path: join(dataDir, f), mtime: statSync(join(dataDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)

    if (listingsFiles.length > 0) {
      return listingsFiles[0]!.path
    }

    // Fallback: any .json file in scripts/data that is not new_ or details_
    const otherFiles = readdirSync(dataDir)
      .filter((f) => f.endsWith('.json') && !f.startsWith('new_') && !f.startsWith('details_'))
      .map((f) => ({ name: f, path: join(dataDir, f), mtime: statSync(join(dataDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)

    if (otherFiles.length > 0) {
      return otherFiles[0]!.path
    }
  }

  throw new Error('No crawl files found in scripts/data/ (expected listings_YYYY-MM-DD.json)')
}

const client = createClient({ url: 'file:.data/db/sqlite.db' })
const db = drizzle(client, { schema })

type DbProduct = typeof schema.products.$inferSelect

async function main() {
  const jsonPath = resolveInputPath()
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Reading ${jsonPath}...`)

  const raw = await readFile(jsonPath, 'utf-8')
  const rawEntries: JsonEntry[] = JSON.parse(raw)
  console.log(`Found ${rawEntries.length} entries in JSON.`)

  // Deduplicate crawl listings by URL (preferring entries with explicit SKU)
  const dedupMap = new Map<string, JsonEntry>()
  for (const entry of rawEntries) {
    const key = entry.url?.trim() || entry.sku?.trim() || entry.name?.trim() || ''
    if (!key) continue
    if (!dedupMap.has(key) || (entry.sku && !dedupMap.get(key)!.sku)) {
      dedupMap.set(key, entry)
    }
  }
  const entries = Array.from(dedupMap.values())
  if (entries.length < rawEntries.length) {
    console.log(`Deduplicated ${rawEntries.length - entries.length} duplicate URL listings (${entries.length} unique items to process).`)
  }

  // Pre-load all DB products into memory index maps for sub-second O(1) lookups
  console.log('Indexing existing database products...')
  const allDbProducts = await db.query.products.findMany()
  console.log(`Loaded ${allDbProducts.length} products from database.`)

  const dbBySku = new Map<string, DbProduct>()
  const dbBySlugSku = new Map<string, DbProduct>()
  const dbByAlphaNum = new Map<string, DbProduct>()
  const dbByName = new Map<string, DbProduct>()

  for (const prod of allDbProducts) {
    if (prod.name) {
      dbByName.set(prod.name.trim().toLowerCase(), prod)
    }
    if (prod.sku) {
      const rawSku = prod.sku.trim().toLowerCase()
      dbBySku.set(rawSku, prod)
      dbBySlugSku.set(rawSku.replace(/[^a-z0-9]+/g, '-'), prod)
      const an = rawSku.replace(/[^a-z0-9]/g, '')
      if (an.length >= 3) {
        dbByAlphaNum.set(an, prod)
      }
    }
  }

  function findMatch(entry: JsonEntry): { product: DbProduct; method: 'sku' | 'url_sku' | 'name' } | null {
    // 1. Direct SKU match (exact, slugified, or alphanumeric)
    if (entry.sku) {
      const raw = entry.sku.trim().toLowerCase()
      if (dbBySku.has(raw)) return { product: dbBySku.get(raw)!, method: 'sku' }
      const slug = raw.replace(/[^a-z0-9]+/g, '-')
      if (dbBySlugSku.has(slug)) return { product: dbBySlugSku.get(slug)!, method: 'sku' }
      const an = raw.replace(/[^a-z0-9]/g, '')
      if (an.length >= 3 && dbByAlphaNum.has(an)) return { product: dbByAlphaNum.get(an)!, method: 'sku' }
    }

    // 2. URL slug SKU match (handles URL suffixes like -855011-00-tw, -kh18606b, -cars2228-1)
    if (entry.url) {
      const filename = entry.url.split('/').pop()?.replace(/\.html$/, '').toLowerCase() || ''
      const parts = filename.split('-')
      for (let len = Math.min(5, parts.length - 1); len >= 1; len--) {
        const candSlug = parts.slice(parts.length - len).join('-')
        if (dbBySlugSku.has(candSlug)) return { product: dbBySlugSku.get(candSlug)!, method: 'url_sku' }
        if (dbBySku.has(candSlug)) return { product: dbBySku.get(candSlug)!, method: 'url_sku' }
        const candAn = candSlug.replace(/[^a-z0-9]/g, '')
        if (candAn.length >= 3 && dbByAlphaNum.has(candAn)) {
          return { product: dbByAlphaNum.get(candAn)!, method: 'url_sku' }
        }
      }
    }

    // 3. Fallback: match by name ONLY if entry has no SKU and no URL SKU candidate
    // If it has a SKU candidate that wasn't found in DB, it is a genuine separate product (new item)
    if (!entry.sku && !entry.url) {
      const name = entry.name?.trim().toLowerCase()
      if (name && dbByName.has(name)) {
        return { product: dbByName.get(name)!, method: 'name' }
      }
    }

    return null
  }

  let matched = 0
  let matchedBySku = 0
  let matchedByUrlSku = 0
  let matchedByName = 0
  let priceChanged = 0
  let stockChanged = 0
  let skuChanged = 0
  let noChange = 0
  let notFound = 0
  let unknownStatus = 0
  let invalidPrice = 0
  let errors = 0

  const unmatched: JsonEntry[] = []
  const seenUnmatched = new Set<string>()

  for (const entry of entries) {
    const name = entry.name?.trim()
    if (!name && !entry.sku && !entry.url) continue

    try {
      const matchResult = findMatch(entry)

      if (!matchResult) {
        notFound++
        const dedupKey = (entry.url || entry.sku || name || '').toLowerCase()
        if (!seenUnmatched.has(dedupKey)) {
          seenUnmatched.add(dedupKey)
          unmatched.push(entry)
        }
        continue
      }

      matched++
      if (matchResult.method === 'sku') matchedBySku++
      else if (matchResult.method === 'url_sku') matchedByUrlSku++
      else if (matchResult.method === 'name') matchedByName++

      const existing = matchResult.product
      const updates: Partial<typeof schema.products.$inferInsert> = {}

      // Price
      if (entry.price != null) {
        const newPrice = Number(entry.price)
        if (!Number.isFinite(newPrice) || newPrice < 0) {
          invalidPrice++
        } else if (newPrice !== existing.price) {
          updates.price = newPrice
          priceChanged++
        }
      }

      // Stock
      if (entry.stock_status) {
        const key = entry.stock_status.toLowerCase().trim()
        if (key in STOCK_MAP) {
          const newStock = STOCK_MAP[key]!
          if (newStock !== existing.stock) {
            updates.stock = newStock
            stockChanged++
          }
        } else {
          unknownStatus++
          console.warn(`Unknown stock_status "${entry.stock_status}" for "${name}"`)
        }
      }

      // SKU (update if missing or if crawl has explicit clean SKU)
      if (entry.sku) {
        const newSku = entry.sku.trim()
        if (newSku && newSku !== existing.sku) {
          updates.sku = newSku
          skuChanged++
        }
      }

      if (Object.keys(updates).length === 0) {
        noChange++
        continue
      }

      if (!dryRun) {
        await db.update(schema.products).set(updates).where(eq(schema.products.id, existing.id))
      } else {
        console.log(`Would update [${matchResult.method}] id=${existing.id} "${existing.name}" (SKU: ${existing.sku}):`, updates)
      }
    } catch (err) {
      errors++
      console.error(`Error on "${name}":`, err)
    }
  }

  // Auto-export unmatched new products for Spider 2
  const inputBaseName = basename(jsonPath)
  const outputBaseName = inputBaseName.startsWith('listings_')
    ? inputBaseName.replace(/^listings_/, 'new_')
    : `new_${inputBaseName}`
  const newProductsPath = join(process.cwd(), 'scripts', 'data', outputBaseName)

  if (unmatched.length > 0) {
    if (!dryRun) {
      await writeFile(newProductsPath, JSON.stringify(unmatched, null, 2))
    }
  }

  console.log('---')
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Summary:`)
  console.log(`  Matched in DB:       ${matched} (direct SKU: ${matchedBySku}, URL SKU: ${matchedByUrlSku}, Name fallback: ${matchedByName})`)
  console.log(`  Not found in DB:     ${notFound} (unique new products: ${unmatched.length})`)
  console.log(`  Price changed:       ${priceChanged}`)
  console.log(`  Stock changed:       ${stockChanged}`)
  console.log(`  SKU changed:         ${skuChanged}`)
  console.log(`  No change needed:    ${noChange}`)
  console.log(`  Unknown statuses:    ${unknownStatus}`)
  console.log(`  Invalid prices:      ${invalidPrice}`)
  console.log(`  Errors:              ${errors}`)

  if (unmatched.length > 0) {
    if (!dryRun) {
      console.log(`  Exported new items:  ${unmatched.length} items -> scripts/data/${outputBaseName}`)
    } else {
      console.log(`  Would export new:    ${unmatched.length} items -> scripts/data/${outputBaseName}`)
    }
  }
}

main()
  .catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
  .finally(() => client.close())
