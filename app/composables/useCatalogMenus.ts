// The category tree and the brand list, each under one fixed key. The header
// menu and the category and brand pages read the same data: without a shared
// key each call site gets its own, so a page load queried the table twice and
// in-app navigation fetched it again. 'defer' joins a request already in flight.
export const useCategoryTree = () => useFetch('/api/categories/tree', { key: 'categories-tree', dedupe: 'defer' })
export const useBrandList = () => useFetch('/api/brands', { key: 'brands', dedupe: 'defer' })
