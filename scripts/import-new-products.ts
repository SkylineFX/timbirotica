import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../server/db/schema'
import { eq } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, statSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'

interface DetailEntry {
  category?: string
  subcategory?: string
  sku?: string
  name?: string
  url?: string
  image_url?: string
  images?: string[]
  price?: string | number
  stock_status?: string
  product_code?: string
  description?: string
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

  // Auto-pick newest details_*.json in scripts/data/
  const dataDir = join(process.cwd(), 'scripts', 'data')
  if (existsSync(dataDir)) {
    const detailsFiles = readdirSync(dataDir)
      .filter((f) => f.startsWith('details_') && f.endsWith('.json'))
      .map((f) => ({ name: f, path: join(dataDir, f), mtime: statSync(join(dataDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)

    if (detailsFiles.length > 0) {
      return detailsFiles[0]!.path
    }
  }

  throw new Error('No details files found in scripts/data/ (expected details_YYYY-MM-DD.json)')
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Ensures image filenames only contain URL-safe [a-zA-Z0-9._-] characters so
 * NuxtImg / IPX, Nitro static serving, and Cloudflare R2 never hit %2B decoding 404s.
 */
function sanitizeImageFilename(rawName: string): string {
  if (!/[^a-zA-Z0-9._-]/.test(rawName)) return rawName
  let decoded = rawName
  try {
    decoded = decodeURIComponent(rawName)
  } catch {
    // keep rawName if malformed percent sequence
  }
  return decoded.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-')
}

function extractImageBasename(urlOrPath: string): string | null {
  const trimmed = urlOrPath.trim()
  if (!trimmed) return null
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const base = new URL(trimmed).pathname.split('/').pop()
      return base ? sanitizeImageFilename(base) : null
    }
  } catch {
    // fallback to string split below
  }
  const base = trimmed.split('/').pop()
  return base ? sanitizeImageFilename(base) : null
}

/**
 * Moves any staged image folders (`public/uploads/products_*`) into `public/uploads/products/`,
 * preserving higher-resolution existing files when filenames overlap.
 */
function syncStagedProductImages(): {
  availableFiles: Set<string>
  stagingDirsProcessed: string[]
  movedNew: number
  replacedLarger: number
  keptExistingHigherRes: number
} {
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  const productsDir = join(uploadsDir, 'products')

  if (!existsSync(productsDir) && !dryRun) {
    mkdirSync(productsDir, { recursive: true })
  }

  const availableFiles = new Set<string>(
    existsSync(productsDir) ? readdirSync(productsDir).filter((f) => !f.startsWith('.')) : []
  )

  const stagingDirsProcessed: string[] = []
  let movedNew = 0
  let replacedLarger = 0
  let keptExistingHigherRes = 0

  if (!existsSync(uploadsDir)) {
    return { availableFiles, stagingDirsProcessed, movedNew, replacedLarger, keptExistingHigherRes }
  }

  const stagingDirs = readdirSync(uploadsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('products_'))
    .map((d) => d.name)
    .sort()

  for (const dirName of stagingDirs) {
    const stagingPath = join(uploadsDir, dirName)
    stagingDirsProcessed.push(dirName)
    const entries = readdirSync(stagingPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (entry.name.startsWith('.')) {
        if (!dryRun) unlinkSync(join(stagingPath, entry.name))
        continue
      }

      const srcPath = join(stagingPath, entry.name)
      const targetName = sanitizeImageFilename(entry.name)
      const destPath = join(productsDir, targetName)

      // If an unsanitized file with the raw name already exists in products/, sanitize it in place first
      if (entry.name !== targetName) {
        const rawDestPath = join(productsDir, entry.name)
        if (existsSync(rawDestPath) && !existsSync(destPath)) {
          if (!dryRun) renameSync(rawDestPath, destPath)
          availableFiles.delete(entry.name)
          availableFiles.add(targetName)
        }
      }

      const destExists = existsSync(destPath) || (dryRun && availableFiles.has(targetName))

      if (!destExists) {
        if (!dryRun) renameSync(srcPath, destPath)
        availableFiles.add(targetName)
        movedNew++
      } else {
        const srcSize = statSync(srcPath).size
        const destSize = existsSync(destPath)
          ? statSync(destPath).size
          : existsSync(join(productsDir, entry.name))
            ? statSync(join(productsDir, entry.name)).size
            : 0

        if (srcSize > destSize) {
          if (!dryRun) renameSync(srcPath, destPath)
          availableFiles.add(targetName)
          replacedLarger++
        } else {
          if (!dryRun) unlinkSync(srcPath)
          availableFiles.add(targetName)
          keptExistingHigherRes++
        }
      }
    }

    if (!dryRun) {
      const remaining = readdirSync(stagingPath)
      if (remaining.length === 0) {
        rmdirSync(stagingPath)
      }
    }
  }

  return { availableFiles, stagingDirsProcessed, movedNew, replacedLarger, keptExistingHigherRes }
}

const client = createClient({ url: 'file:.data/db/sqlite.db' })
const db = drizzle(client, { schema })

type DbCategory = typeof schema.categories.$inferSelect

async function main() {
  const jsonPath = resolveInputPath()
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Reading ${jsonPath}...`)

  const raw = await readFile(jsonPath, 'utf-8')
  const entries: DetailEntry[] = JSON.parse(raw)
  console.log(`Found ${entries.length} entries in details JSON.`)

  // 0. Sync any staged images from public/uploads/products_* into public/uploads/products/
  const imageSync = syncStagedProductImages()
  if (imageSync.stagingDirsProcessed.length > 0) {
    console.log(
      `${dryRun ? '[DRY RUN] ' : ''}Processed staged image dir(s) [${imageSync.stagingDirsProcessed.join(', ')}]: ` +
        `moved ${imageSync.movedNew} new, replaced ${imageSync.replacedLarger} larger, kept ${imageSync.keptExistingHigherRes} existing higher-res.`
    )
  }

  function resolveLocalImages(entry: DetailEntry): { paths: string[] | null; missingFiles: number } {
    const rawUrls = Array.isArray(entry.images) && entry.images.length > 0
      ? entry.images
      : entry.image_url
        ? [entry.image_url]
        : []

    if (rawUrls.length === 0) return { paths: null, missingFiles: 0 }

    const localPaths: string[] = []
    const seen = new Set<string>()
    let missingFiles = 0

    for (const url of rawUrls) {
      const filename = extractImageBasename(url)
      if (!filename || seen.has(filename)) continue
      seen.add(filename)

      if (imageSync.availableFiles.has(filename)) {
        localPaths.push(`/uploads/products/${filename}`)
      } else {
        missingFiles++
      }
    }

    return { paths: localPaths.length > 0 ? localPaths : null, missingFiles }
  }

  // 1. Index existing categories (strictly reuse existing categories; never create new ones)
  console.log('Loading existing categories...')
  const allCategories = await db.query.categories.findMany()
  const parentsByName = new Map<string, DbCategory>()
  const subcatsByParentAndName = new Map<string, DbCategory>()
  const subcatsByParentAndSlug = new Map<string, DbCategory>()
  const subcatsByNameGlobal = new Map<string, DbCategory>()
  const subcatsBySlugGlobal = new Map<string, DbCategory>()

  for (const cat of allCategories) {
    const lowerName = cat.name.trim().toLowerCase()
    if (cat.parentId == null) {
      parentsByName.set(lowerName, cat)
    } else {
      subcatsByParentAndName.set(`${cat.parentId}::${lowerName}`, cat)
      subcatsByParentAndSlug.set(`${cat.parentId}::${cat.slug}`, cat)
      subcatsByNameGlobal.set(lowerName, cat)
      subcatsBySlugGlobal.set(cat.slug, cat)
    }
  }

  function resolveCategoryId(entry: DetailEntry): { id: number | null; crossParent: boolean } {
    const parentName = entry.category?.trim()
    const subName = entry.subcategory?.trim()
    const parent = parentName ? parentsByName.get(parentName.toLowerCase()) : undefined

    if (subName) {
      const subLower = subName.toLowerCase()
      const subSlug = slugify(subName)

      if (parent) {
        // 1. Exact subcategory match under the crawled parent
        const exact = subcatsByParentAndName.get(`${parent.id}::${subLower}`)
        if (exact) return { id: exact.id, crossParent: false }

        // 2. Deeper URL path segment matching a subcategory slug under the same parent (e.g. /hartie-copiator-alba/)
        if (entry.url) {
          try {
            const parts = new URL(entry.url).pathname.split('/').filter(Boolean)
            parts.pop() // remove .html filename
            for (let i = parts.length - 1; i >= 1; i--) {
              const segMatch = subcatsByParentAndSlug.get(`${parent.id}::${parts[i]}`)
              if (segMatch) return { id: segMatch.id, crossParent: false }
            }
          } catch {
            // ignore invalid URLs
          }
        }

        // 3. Slug match under the same parent (e.g. 'Hartie copiator' -> slug 'hartie-copiator')
        const slugMatchParent = subcatsByParentAndSlug.get(`${parent.id}::${subSlug}`)
        if (slugMatchParent) return { id: slugMatchParent.id, crossParent: false }
      }

      // 4. Match existing subcategory globally across ANY parent category
      const globalByName = subcatsByNameGlobal.get(subLower)
      if (globalByName) return { id: globalByName.id, crossParent: true }

      const globalBySlug = subcatsBySlugGlobal.get(subSlug)
      if (globalBySlug) return { id: globalBySlug.id, crossParent: true }

      console.warn(`Unknown subcategory "${subName}" (parent: "${parentName ?? 'none'}") for "${entry.name}"`)
    }

    return { id: parent?.id ?? null, crossParent: false }
  }

  // 2. Index existing brands
  console.log('Loading existing brands...')
  const allBrands = await db.query.brands.findMany()
  // Sort longer brand names first so "Graf von Faber-Castell" matches before "Faber-Castell"
  const sortedBrands = [...allBrands].sort((a, b) => b.name.length - a.name.length)

  function detectBrandId(productName: string): number | null {
    const upper = productName.toUpperCase()
    for (const b of sortedBrands) {
      const bUpper = b.name.toUpperCase()
      const regex = new RegExp(`(?:^|[^A-Z0-9])${bUpper.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}(?:$|[^A-Z0-9])`, 'i')
      if (regex.test(upper)) {
        return b.id
      }
    }
    return null
  }

  // 3. Index existing products (SKUs, slugs, and current images) for deduplication, image backfill & unique slugs
  console.log('Loading existing products...')
  const existingProducts = await db.query.products.findMany({
    columns: { id: true, sku: true, slug: true, images: true },
  })

  const existingBySku = new Map<string, (typeof existingProducts)[number]>()
  const existingSlugs = new Set<string>()

  for (const prod of existingProducts) {
    if (prod.sku) {
      const rawKey = prod.sku.trim().toLowerCase()
      existingBySku.set(rawKey, prod)
      existingBySku.set(rawKey.replace(/[^a-z0-9]+/g, '-'), prod)
    }
    if (prod.slug) {
      existingSlugs.add(prod.slug)
    }
  }

  console.log(`Found ${existingProducts.length} existing products in DB.`)

  // 4. Process each entry
  const productsToInsert: (typeof schema.products.$inferInsert)[] = []
  const productsToUpdateImages: { id: number; images: string[] }[] = []
  let skippedAlreadyInDb = 0
  let crossParentCategoriesMatched = 0
  let brandsMatched = 0
  let brandsUnmatched = 0
  let totalLocalImageLinks = 0
  let missingImageFilesOnDisk = 0

  for (const entry of entries) {
    const name = entry.name?.trim()
    if (!name) continue

    const sku = entry.sku?.trim() || entry.url?.match(/-([a-zA-Z0-9]+)\.html$/)?.[1]
    const skuKey = sku?.toLowerCase()

    const { paths: localImages, missingFiles } = resolveLocalImages(entry)
    missingImageFilesOnDisk += missingFiles

    // Check if already in DB by SKU
    const existingProd = skuKey
      ? existingBySku.get(skuKey) ?? existingBySku.get(skuKey.replace(/[^a-z0-9]+/g, '-'))
      : undefined

    if (existingProd) {
      // Backfill images if the existing product currently has no images
      if ((!existingProd.images || existingProd.images.length === 0) && localImages && localImages.length > 0) {
        productsToUpdateImages.push({ id: existingProd.id, images: localImages })
        existingProd.images = localImages
        totalLocalImageLinks += localImages.length
      } else {
        skippedAlreadyInDb++
      }
      continue
    }

    if (localImages) {
      totalLocalImageLinks += localImages.length
    }

    // Resolve Category / Subcategory (strictly reuse existing categories, even across parents)
    const { id: categoryId, crossParent } = resolveCategoryId(entry)
    if (crossParent) crossParentCategoriesMatched++

    // Resolve Brand
    const brandId = detectBrandId(name)
    if (brandId) brandsMatched++
    else brandsUnmatched++

    // Resolve Stock
    let stock = 1
    if (entry.stock_status) {
      const key = entry.stock_status.toLowerCase().trim()
      if (key in STOCK_MAP) {
        stock = STOCK_MAP[key]!
      }
    }

    // Resolve Price
    const price = Number(entry.price) || 0

    // Generate unique slug
    let baseSlug = slugify(name)
    if (!baseSlug) baseSlug = 'produs'
    let slug = baseSlug

    if (existingSlugs.has(slug)) {
      const skuSlug = sku ? slugify(sku) : ''
      if (skuSlug && !existingSlugs.has(`${baseSlug}-${skuSlug}`)) {
        slug = `${baseSlug}-${skuSlug}`
      } else {
        let counter = 2
        while (existingSlugs.has(`${slug}-${counter}`)) {
          counter++
        }
        slug = `${slug}-${counter}`
      }
    }
    existingSlugs.add(slug)

    const newRecord: typeof schema.products.$inferInsert = {
      name,
      slug,
      sku: sku || null,
      description: entry.description?.trim() || null,
      price,
      categoryId,
      brandId,
      images: localImages,
      stock,
      isRecommended: false,
      createdAt: new Date(),
    }
    productsToInsert.push(newRecord)

    if (skuKey) {
      existingBySku.set(skuKey, { id: -1, sku: sku || null, slug, images: localImages })
    }
  }

  // 5. Insert new products in batches
  const BATCH_SIZE = 100
  let insertedCount = 0

  if (!dryRun && productsToInsert.length > 0) {
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE)
      await db.insert(schema.products).values(batch)
      insertedCount += batch.length
    }
  } else {
    insertedCount = productsToInsert.length
  }

  // 6. Backfill images onto existing products that previously had images = null
  let imagesBackfilledCount = 0
  if (!dryRun && productsToUpdateImages.length > 0) {
    await db.transaction(async (tx) => {
      for (const item of productsToUpdateImages) {
        await tx
          .update(schema.products)
          .set({ images: item.images })
          .where(eq(schema.products.id, item.id))
        imagesBackfilledCount++
      }
    })
  } else {
    imagesBackfilledCount = productsToUpdateImages.length
  }

  console.log('---')
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Import Summary:`)
  console.log(`  Total entries in JSON:     ${entries.length}`)
  console.log(`  New products inserted:     ${insertedCount}`)
  console.log(`  Existing images updated:   ${imagesBackfilledCount}`)
  console.log(`  Already complete (skip):   ${skippedAlreadyInDb}`)
  console.log(`  Total local image links:   ${totalLocalImageLinks}`)
  if (imageSync.stagingDirsProcessed.length > 0) {
    console.log(`  Staged files moved (new):  ${imageSync.movedNew}`)
    console.log(`  Staged files replaced:     ${imageSync.replacedLarger}`)
    console.log(`  Existing higher-res kept:  ${imageSync.keptExistingHigherRes}`)
  }
  if (missingImageFilesOnDisk > 0) {
    console.log(`  Missing image files:       ${missingImageFilesOnDisk}`)
  }
  if (insertedCount > 0) {
    console.log(`  Cross-parent cat matches:  ${crossParentCategoriesMatched}`)
    console.log(`  Brands matched:            ${brandsMatched}`)
    console.log(`  Brands unmatched:          ${brandsUnmatched}`)
  }
}

main()
  .catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
  .finally(() => client.close())
