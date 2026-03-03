
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../server/db/schema';
import { isNotNull, sql } from 'drizzle-orm';

const client = createClient({ url: 'file:.data/db/sqlite.db' });
const db = drizzle(client, { schema });

async function main() {
  const result = await db.query.products.findFirst({
    where: isNotNull(schema.products.sku),
  });

  if (result) {
    console.log('Verification Successful: Found product with SKU');
    console.log('Name:', result.name);
    console.log('SKU:', result.sku);
    console.log('Description length:', result.description?.length);
  } else {
    console.error('Verification Failed: No product with SKU found.');
  }

  client.close();
}

main();
