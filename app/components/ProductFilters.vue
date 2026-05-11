<script setup lang="ts">
type FacetItem = { slug: string; name: string; count: number }
type Facets = {
  price: { min: number; max: number } | null
  brands: FacetItem[] | null
  subcategories: FacetItem[] | null
}

const props = defineProps<{
  facets: Facets
  hideBrand?: boolean
  hideSubcategory?: boolean
}>()

const route = useRoute()

const updateQuery = (changes: Record<string, string | undefined>) => {
  const next: Record<string, any> = { ...route.query, ...changes, page: 1 }
  for (const k of Object.keys(next)) {
    if (next[k] === undefined || next[k] === '') delete next[k]
  }
  return navigateTo({ query: next })
}

const onlyAvailable = computed({
  get: () => route.query.available === '1',
  set: (val: boolean) => { updateQuery({ available: val ? '1' : undefined }) }
})

const parseSlugList = (v: unknown): string[] =>
  v ? String(v).split(',').filter(Boolean) : []

const selectedSubs = ref<string[]>(parseSlugList(route.query.sub))
const selectedBrands = ref<string[]>(parseSlugList(route.query.b))

watch(() => route.query.sub, (v) => {
  const next = parseSlugList(v)
  if (next.join(',') !== selectedSubs.value.join(',')) selectedSubs.value = next
})
watch(() => route.query.b, (v) => {
  const next = parseSlugList(v)
  if (next.join(',') !== selectedBrands.value.join(',')) selectedBrands.value = next
})

const toggleSub = (slug: string) => {
  const set = new Set(selectedSubs.value)
  set.has(slug) ? set.delete(slug) : set.add(slug)
  selectedSubs.value = Array.from(set)
  updateQuery({ sub: set.size ? selectedSubs.value.join(',') : undefined })
}

const toggleBrand = (slug: string) => {
  const set = new Set(selectedBrands.value)
  set.has(slug) ? set.delete(slug) : set.add(slug)
  selectedBrands.value = Array.from(set)
  updateQuery({ b: set.size ? selectedBrands.value.join(',') : undefined })
}

const priceBounds = computed(() => props.facets.price ?? { min: 0, max: 0 })
const showPrice = computed(() =>
  !!props.facets.price && props.facets.price.min < props.facets.price.max
)

const parsePriceQuery = (v: unknown, fallback: number): number => {
  if (v == null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const initialPrice = (): [number, number] => {
  const { min, max } = priceBounds.value
  if (!showPrice.value) return [min, max]
  let qMin = parsePriceQuery(route.query.minPrice, min)
  let qMax = parsePriceQuery(route.query.maxPrice, max)
  qMin = Math.min(Math.max(qMin, min), max)
  qMax = Math.min(Math.max(qMax, min), max)
  if (qMin > qMax) return [min, max]
  return [qMin, qMax]
}

const localPrice = ref<[number, number]>(initialPrice())

watch(
  () => [priceBounds.value.min, priceBounds.value.max, route.query.minPrice, route.query.maxPrice],
  () => { localPrice.value = initialPrice() }
)

let priceDebounce: ReturnType<typeof setTimeout> | null = null
const onPriceChange = (val: [number, number] | undefined) => {
  if (!val || val.length < 2) return
  const tuple: [number, number] = [val[0]!, val[1]!]
  localPrice.value = tuple
  if (priceDebounce) clearTimeout(priceDebounce)
  priceDebounce = setTimeout(() => {
    const [lo, hi] = tuple
    const { min, max } = priceBounds.value
    updateQuery({
      minPrice: lo > min ? String(Math.round(lo)) : undefined,
      maxPrice: hi < max ? String(Math.round(hi)) : undefined
    })
  }, 400)
}

onBeforeUnmount(() => {
  if (priceDebounce) clearTimeout(priceDebounce)
})

const showBrand = computed(() =>
  !props.hideBrand && !!props.facets.brands && props.facets.brands.length > 0
)
const showSub = computed(() =>
  !props.hideSubcategory && !!props.facets.subcategories && props.facets.subcategories.length > 0
)

</script>

<template>
  <div class="space-y-6">
    <section v-if="showPrice">
      <h3 class="text-sm font-semibold mb-3">Pret</h3>
      <USlider
        :model-value="localPrice"
        :min="priceBounds.min"
        :max="priceBounds.max"
        :step="1"
        class="mt-2"
        @update:model-value="onPriceChange"
      />
      <div class="flex justify-between text-xs mt-3 text-gray-600">
        <span>{{ Math.round(localPrice[0]) }} RON</span>
        <span>{{ Math.round(localPrice[1]) }} RON</span>
      </div>
    </section>

    <section>
      <h3 class="text-sm font-semibold mb-3">Disponibilitate</h3>
      <USwitch v-model="onlyAvailable" label="Doar produse disponibile" />
    </section>

    <section v-if="showSub">
      <h3 class="text-sm font-semibold mb-3">Subcategorie</h3>
      <div class="space-y-2 max-h-64 overflow-auto pr-1">
        <UCheckbox
          v-for="sub in facets.subcategories!"
          :key="sub.slug"
          :model-value="selectedSubs.includes(sub.slug)"
          :label="`${sub.name} (${sub.count})`"
          :disabled="sub.count === 0 && !selectedSubs.includes(sub.slug)"
          @update:model-value="toggleSub(sub.slug)"
        />
      </div>
    </section>

    <section v-if="showBrand">
      <h3 class="text-sm font-semibold mb-3">Brand</h3>
      <div class="space-y-2 max-h-64 overflow-auto pr-1">
        <UCheckbox
          v-for="brand in facets.brands!"
          :key="brand.slug"
          :model-value="selectedBrands.includes(brand.slug)"
          :label="`${brand.name} (${brand.count})`"
          :disabled="brand.count === 0 && !selectedBrands.includes(brand.slug)"
          @update:model-value="toggleBrand(brand.slug)"
        />
      </div>
    </section>
  </div>
</template>
