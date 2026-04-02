
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Database connection
const client = createClient({ url: 'file:.data/db/sqlite.db' });
const db = drizzle(client, { schema });

async function main() {
  console.log('Starting product update...');

  // Read JSON file
  const jsonPath = join(process.cwd(), 'public', 'descriptions.json');
  console.log(`Reading descriptions from ${jsonPath}...`);

  try {
    const fileContent = await readFile(jsonPath, 'utf-8');
    const productsData = JSON.parse(fileContent);

    console.log(`Found ${productsData.length} products in JSON.`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const item of productsData) {
      const { name, description, sku, product_code } = item;

      if (!name) {
        console.warn('Skipping item without name:', item);
        continue;
      }

      // Determine SKU: prioritize 'sku', fallback to 'product_code'
      const finalSku = sku || product_code;

      try {
        // Find product by name
        const existingProduct = await db.query.products.findFirst({
          where: eq(schema.products.name, name),
        });

        if (existingProduct) {
          // Update product
          await db.update(schema.products)
            .set({
              description: description || null,
              sku: finalSku || null
            })
            .where(eq(schema.products.id, existingProduct.id));

          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} products...`);
          }
        } else {
          // precise matching required by user, so if not found, we skip
          // console.log(`Product not found in DB: "${name}"`);
          notFoundCount++;
        }
      } catch (err) {
        console.error(`Error updating product "${name}":`, err);
        errorCount++;
      }
    }

    console.log('Update complete.');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Not Found in DB: ${notFoundCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Failed to read or parse descriptions.json:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
