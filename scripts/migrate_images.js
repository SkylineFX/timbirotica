import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// DB Setup
const dbClient = createClient({
  url: 'file:.data/db/sqlite.db' // Run from project root
});

const csvPath = path.join(projectRoot, 'public', 'feedlecom_categorii_ro.csv');
const galleryPath = path.join(projectRoot, 'public', 'products');

// Ensure folder exists
if (!fs.existsSync(galleryPath)) {
  fs.mkdirSync(galleryPath, { recursive: true });
}

// Polite delay function
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function downloadImage(url, dest) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return true;
  } catch (err) {
    console.warn(`[WARN] Failed downlading ${url}: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('🔄 Loading Products from DB...');
  const result = await dbClient.execute('SELECT id, sku, images FROM products');
  const products = result.rows;
  console.log(`✅ Loaded ${products.length} products from Database.`);

  // Map of sku -> product
  const productMap = new Map();
  for (const p of products) {
    if (p.sku) productMap.set(p.sku, p);
  }

  const parser = fs.createReadStream(csvPath).pipe(parse({ columns: true, skip_empty_lines: true }));

  let rowsProcessed = 0;
  let productsUpdated = 0;
  let totalImagesDownloaded = 0;

  for await (const record of parser) {
    rowsProcessed++;
    const sku = record.cod_lecom;

    if (!productMap.has(sku)) continue; // Product not in DB
    
    const dbProduct = productMap.get(sku);
    
    // Parse current images safely to valid JSON arrays
    let currentImages = [];
    if (dbProduct.images && dbProduct.images.length > 0) {
      try {
        currentImages = JSON.parse(dbProduct.images);
      } catch(e) {
        // If not array, it might be the raw string we renamed! Actually SQLite updated them.
        if (typeof dbProduct.images === 'string' && dbProduct.images.startsWith('[')) {
           currentImages = JSON.parse(dbProduct.images);
        } else {
           currentImages = [dbProduct.images]; // recover fallback
        }
      }
    }

    const pozas = [record.poza2, record.poza3, record.poza4, record.poza5].filter(p => !!p && p.trim() !== '');

    let needsDbUpdate = false;

    // Process additional images
    for (const imgUrl of pozas) {
      const filename = imgUrl.split('/').pop();
      if (!filename || filename.length < 3) continue;

      const localPathStr = `/products/${filename}`;
      const absoluteLocalDest = path.join(galleryPath, filename);
      
      // Keep only unique photos mapping
      if (!currentImages.includes(localPathStr)) {
        
        // Ensure not purely redownloading if file exists
        if (!fs.existsSync(absoluteLocalDest)) {
          console.log(`Downloading: ${sku} -> ${filename}`);
          const success = await downloadImage(imgUrl, absoluteLocalDest);
          if (success) {
             currentImages.push(localPathStr);
             needsDbUpdate = true;
             totalImagesDownloaded++;
          }
          await delay(400); // 400ms polite throttle per image fetched!
        } else {
          // File exists physically, but string missing in array
          currentImages.push(localPathStr);
          needsDbUpdate = true;
        }

      }
    }

    if (needsDbUpdate) {
      const imgJson = JSON.stringify(currentImages);
      await dbClient.execute({
        sql: 'UPDATE products SET images = ? WHERE id = ?',
        args: [imgJson, dbProduct.id]
      });
      productsUpdated++;
      console.log(`[OK] DB Updated: ${sku} (Total Images: ${currentImages.length})`);
    }

  }

  console.log('\n=================================\n');
  console.log(`🟢 Finished Migration Script!`);
  console.log(`Rows analyzed: ${rowsProcessed}`);
  console.log(`Products structurally updated: ${productsUpdated}`);
  console.log(`New Images Downloaded locally: ${totalImagesDownloaded}`);
  process.exit(0);
}

run().catch(console.error);
