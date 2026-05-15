import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../server/db/schema'
import { eq } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface JsonEntry {
  category?: string
  subcategory?: string
  sku?: string
  name?: string
  url?: string
  image_url?: string
  price?: string
  stock_status?: string
}

const STOCK_MAP: Record<string, number> = {
  'in stoc': 1,
  'stoc limitat': 1,
  'produs momentan indisponibil': 0,
}

const dryRun = process.argv.includes('--dry-run')

const client = createClient({ url: 'file:.data/db/sqlite.db' })
const db = drizzle(client, { schema })

async function main() {
  const jsonPath = join(process.cwd(), 'public', 'temporary', 'products_updated.json')
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Reading ${jsonPath}...`)

  const raw = await readFile(jsonPath, 'utf-8')
  const entries: JsonEntry[] = JSON.parse(raw)
  console.log(`Found ${entries.length} entries in JSON.`)

  let matched = 0
  let priceChanged = 0
  let stockChanged = 0
  let skuChanged = 0
  let noChange = 0
  let notFound = 0
  let unknownStatus = 0
  let invalidPrice = 0
  let errors = 0

  for (const entry of entries) {
    const name = entry.name?.trim()
    if (!name) continue

    try {
      const existing = await db.query.products.findFirst({
        where: eq(schema.products.name, name),
      })

      if (!existing) {
        notFound++
        continue
      }
      matched++

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

      // SKU
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
        console.log(`Would update id=${existing.id} "${name}":`, updates)
      }
    } catch (err) {
      errors++
      console.error(`Error on "${name}":`, err)
    }
  }

  console.log('---')
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Summary:`)
  console.log(`  Matched in DB:       ${matched}`)
  console.log(`  Not found in DB:     ${notFound}`)
  console.log(`  Price changed:       ${priceChanged}`)
  console.log(`  Stock changed:       ${stockChanged}`)
  console.log(`  SKU changed:         ${skuChanged}`)
  console.log(`  No change needed:    ${noChange}`)
  console.log(`  Unknown statuses:    ${unknownStatus}`)
  console.log(`  Invalid prices:      ${invalidPrice}`)
  console.log(`  Errors:              ${errors}`)
}

main()
  .catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
  .finally(() => client.close())
