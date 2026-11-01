# Catalog Data & Scrape Pipeline

All catalog scrape files live directly in this directory with a standardized prefix and date (`YYYY-MM-DD.json`).

## Naming Standard

| Step | Prefix | Example | Description |
|---|---|---|---|
| **Step 1** | `listings_` | `listings_YYYY-MM-DD.json` | Broad catalog crawl from Spider 1 (prices & stock for all products) |
| **Step 2** | `new_` | `new_YYYY-MM-DD.json` | Unmatched products automatically exported for Spider 2 |
| **Step 3** | `details_` | `details_YYYY-MM-DD.json` | Enriched products with full descriptions from Spider 2 |

All `.json` files in this folder are gitignored to keep the repository lightweight.

---

## The Workflow

### Step 1: Broad Crawl (Spider 1)
Run your catalog crawl in your Scrapy project, outputting to:
`scripts/data/listings_YYYY-MM-DD.json`

### Step 2: Update Prices & Auto-Export New Products
Run from the project root:
```bash
npx tsx scripts/update-product-prices-stock.ts
```
* **Auto-detects** the newest `listings_*.json` file.
* Updates prices and stock availability in `.data/db/sqlite.db`.
* **Automatically exports** all unmatched products to `scripts/data/new_YYYY-MM-DD.json`.

*(Optional preview: `npx tsx scripts/update-product-prices-stock.ts --dry-run`)*

### Step 3: Scrape Descriptions for New Products (Spider 2)
In your Scrapy project, run Spider 2 pointing at the generated `new_` file, outputting to `details_`:
```bash
scrapy crawl product_details -a input_file=/path/to/nuxtpage/scripts/data/new_YYYY-MM-DD.json -O /path/to/nuxtpage/scripts/data/details_YYYY-MM-DD.json
```

### Step 4: Import New Products & Sync Images into Database
Place any downloaded product images directory into `public/uploads/products_YYYY-MM-DD/`, then run:
```bash
npx tsx scripts/import-new-products.ts
```
* **Auto-detects** the newest `details_*.json` file.
* **Auto-moves** any staged images from `public/uploads/products_*` into `public/uploads/products/` (preserving higher-resolution existing files) and cleans up the empty staging folder.
* Inserts new products (or backfills `images` onto existing products with `images = null`) into `.data/db/sqlite.db` using local `/uploads/products/...` paths.
