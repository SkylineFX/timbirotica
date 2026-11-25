// The category tree behind the header menu, /c, the category pages and the
// category carousels (GET /api/categories/tree). It is embedded in every page,
// so it carries only what those use.

export interface CategoryNode {
  id: number
  label: string
  /** The category page, /c/<slug>. */
  to: string
  /** Only categories that have a picture (the top-level ones on /c). */
  image?: string
  children: CategoryNode[]
}

interface CategoryRow {
  id: number
  name: string
  slug: string
  parentId: number | null
  image: string | null
}

/** Builds the tree in row order. A category whose parent is missing is left out. */
export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>()
  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      label: row.name,
      to: `/c/${row.slug}`,
      ...(row.image ? { image: row.image } : {}),
      children: [],
    })
  }

  const tree: CategoryNode[] = []
  for (const row of rows) {
    const node = nodes.get(row.id)!
    if (row.parentId) nodes.get(row.parentId)?.children.push(node)
    else tree.push(node)
  }
  return tree
}

/** The first category, at any depth, that matches. */
export function findCategory(nodes: CategoryNode[], match: (node: CategoryNode) => boolean): CategoryNode | undefined {
  for (const node of nodes) {
    if (match(node)) return node
    const found = findCategory(node.children, match)
    if (found) return found
  }
}
