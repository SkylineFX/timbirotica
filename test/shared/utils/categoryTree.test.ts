import { describe, it, expect } from 'vitest'
import { buildCategoryTree, findCategory } from '~~/shared/utils/categoryTree'

const rows = [
  {
    id: 1,
    name: 'Arta si grafica',
    slug: 'arta-si-grafica',
    parentId: null,
    image: 'https://cdn.timbirotica.ro/arta.jpg'
  },
  { id: 2, name: 'Creioane colorate', slug: 'creioane-colorate', parentId: 1, image: null },
  { id: 3, name: 'Acuarele', slug: 'acuarele', parentId: 2, image: null },
  { id: 4, name: 'Articole birou', slug: 'articole-birou', parentId: null, image: null },
  { id: 5, name: 'Fara parinte', slug: 'fara-parinte', parentId: 99, image: null }
]

describe('buildCategoryTree', () => {
  const tree = buildCategoryTree(rows)

  it('nests categories under their parents, in row order', () => {
    expect(tree.map((node) => node.label)).toEqual(['Arta si grafica', 'Articole birou'])
    expect(tree[0]!.children[0]!.label).toBe('Creioane colorate')
    expect(tree[0]!.children[0]!.children[0]!.to).toBe('/c/acuarele')
  })

  it('keeps only the fields the pages use, and the image only when there is one', () => {
    expect(tree[0]).toEqual({
      id: 1,
      label: 'Arta si grafica',
      to: '/c/arta-si-grafica',
      image: 'https://cdn.timbirotica.ro/arta.jpg',
      children: [expect.objectContaining({ id: 2 })]
    })
    expect(tree[1]).toEqual({
      id: 4,
      label: 'Articole birou',
      to: '/c/articole-birou',
      children: []
    })
  })

  it('leaves out a category whose parent is missing', () => {
    expect(findCategory(tree, (node) => node.id === 5)).toBeUndefined()
  })
})

describe('findCategory', () => {
  const tree = buildCategoryTree(rows)

  it('finds a category at any depth', () => {
    expect(findCategory(tree, (node) => node.id === 3)?.label).toBe('Acuarele')
    expect(findCategory(tree, (node) => node.to === '/c/articole-birou')?.id).toBe(4)
  })

  it('returns undefined when nothing matches', () => {
    expect(findCategory(tree, (node) => node.id === 42)).toBeUndefined()
    expect(findCategory([], () => true)).toBeUndefined()
  })
})
