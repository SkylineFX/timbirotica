<script setup lang="ts">
const props = defineProps<{
  title: string
  subtitle?: string
  apiQuery: Record<string, any>
  emptyMessage: string
  breadcrumbs?: any[]
}>()

const route = useRoute()

const limitOptions = [
  { label: '24 pe pagina', value: 24 },
  { label: '48 pe pagina', value: 48 },
  { label: '96 pe pagina', value: 96 }
]

const limit = computed({
  get: () => Number(route.query.limit) || 24,
  set: async (val) => {
    if (val === limit.value) return
    await navigateTo({ query: { ...route.query, limit: val, page: 1 } })
  }
})

const page = computed({
  get: () => Number(route.query.page) || 1,
  set: async (val) => {
    if (val === page.value) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    await navigateTo({ query: { ...route.query, page: val } })
  }
})

const sortOptions = [
  { label: 'Cele mai noi', value: 'default' },
  { label: 'Preț crescător', value: 'price-asc' },
  { label: 'Preț descrescător', value: 'price-desc' },
  { label: 'Nume: A-Z', value: 'name-asc' },
  { label: 'Nume: Z-A', value: 'name-desc' }
]

const sort = computed({
  get: () => route.query.sort as string || 'default',
  set: async (val) => {
    if (val === sort.value) return
    await navigateTo({ query: { ...route.query, sort: val, page: 1 } })
  }
})

const fetchQuery = computed(() => {
  return {
    ...props.apiQuery,
    page: page.value,
    sort: sort.value,
    limit: limit.value,
    minPrice: route.query.minPrice,
    maxPrice: route.query.maxPrice,
    available: route.query.available,
    sub: route.query.sub,
    b: route.query.b
  }
})

const { data, status } = await useFetch('/api/products', {
    query: fetchQuery,
    watch: [fetchQuery]
})

const products = computed(() => data.value?.products || [])
const total = computed(() => data.value?.total || 0)
const facets = computed(() => data.value?.facets || { price: null, brands: null, subcategories: null })

const normalizePriceQuery = () => {
  const priceFacet = facets.value.price
  if (!priceFacet || priceFacet.min >= priceFacet.max) return
  const { min, max } = priceFacet

  const rawMin = route.query.minPrice
  const rawMax = route.query.maxPrice
  if (rawMin == null && rawMax == null) return

  const parsedMin = rawMin != null && rawMin !== '' ? Number(rawMin) : null
  const parsedMax = rawMax != null && rawMax !== '' ? Number(rawMax) : null

  let nextMin: any = rawMin
  let nextMax: any = rawMax

  if (parsedMin !== null && (!Number.isFinite(parsedMin) || parsedMin <= min || parsedMin > max)) nextMin = undefined
  if (parsedMax !== null && (!Number.isFinite(parsedMax) || parsedMax >= max || parsedMax < min)) nextMax = undefined
  if (
    nextMin !== undefined && nextMax !== undefined &&
    parsedMin !== null && parsedMax !== null &&
    Number.isFinite(parsedMin) && Number.isFinite(parsedMax) &&
    parsedMin > parsedMax
  ) {
    nextMin = undefined
    nextMax = undefined
  }

  if (nextMin === rawMin && nextMax === rawMax) return

  const next: Record<string, any> = { ...route.query, minPrice: nextMin, maxPrice: nextMax }
  for (const k of Object.keys(next)) {
    if (next[k] === undefined || next[k] === '') delete next[k]
  }
  return navigateTo({ query: next }, { replace: true })
}

watch(
  () => [facets.value.price?.min, facets.value.price?.max, route.query.minPrice, route.query.maxPrice],
  () => normalizePriceQuery(),
  { immediate: true }
)

const hideBrand = computed(() => !!props.apiQuery.brand)

const activeFilterCount = computed(() => {
  const q = route.query
  let count = 0
  if (q.minPrice || q.maxPrice) count++
  if (q.available === '1') count++
  if (q.sub) count += String(q.sub).split(',').filter(Boolean).length
  if (q.b) count += String(q.b).split(',').filter(Boolean).length
  return count
})

const isFiltersOpen = ref(false)

const resetFilters = () => {
  navigateTo({ query: { ...route.query, minPrice: undefined, maxPrice: undefined, available: undefined, sub: undefined, b: undefined, page: 1 } })
}
</script>

<template>
  <UContainer class="py-6">
    <UBreadcrumb v-if="breadcrumbs?.length" :items="breadcrumbs" :ui="{ separatorIcon: 'w-4 h-4' }" class="mb-6 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_li]:shrink-0 [&_li:last-child]:shrink-1 [&_li:last-child]:min-w-0" />
    <div class="flex flex-col mb-8 gap-4 rounded-md p-4 bg-white">
      <h1 class="text-xl font-bold flex flex-wrap items-baseline gap-2 xl:text-2xl">
        {{ title }} <span v-if="subtitle" class="font-normal italic">"{{ subtitle }}"</span>
        <span v-if="total !== undefined" class="text-sm font-medium text-gray-500 normal-case">
          ({{ total }} produse)
        </span>
      </h1>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 xl:gap-4">
        <div class="w-full flex gap-2">
          <div class="flex items-center gap-2 flex-1 sm:flex-none">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-sliders-horizontal"
              class="rounded-sm sm:text-sm w-full sm:w-auto"
              size="lg"
              @click="isFiltersOpen = true"
            >
              <span class="flex justify-between items-center gap-2 w-full">Filtreaza
              <UBadge v-if="activeFilterCount > 0" color="primary" variant="solid" class="ml-1 rounded-sm w-5 h-5 p-0 flex items-center justify-center text-xs">
                {{ activeFilterCount }}
              </UBadge>
              </span>
            </UButton>
          </div>
          <div class="flex items-center justify-between gap-2 sm:ml-auto flex-1 sm:flex-none">
            <p class="hidden md:block text-sm font-medium text-gray-500">Sorteaza dupa:</p>
            <USelect v-model="sort" :items="sortOptions" value-key="value" label-key="label" size="lg" class="w-full sm:w-36 rounded-sm" />
          </div>
        </div>

        <div class="hidden md:flex items-center gap-2">
           <p class="text-sm font-medium text-gray-500">Produse:</p>
           <USelect v-model="limit" :items="limitOptions" value-key="value" label-key="label" size="lg" class="w-36 rounded-sm" />
        </div>
      </div>
    </div>

    <USlideover v-model:open="isFiltersOpen" side="left" title="Filtre">
      <template #body>
        <ProductFilters
          :facets="facets"
          :hide-brand="hideBrand"
        />
      </template>
      <template #footer>
        <div class="flex gap-2 w-full">
          <UButton
            color="primary"
            variant="subtle"
            trailing-icon="i-lucide-arrow-right"
            block
            class="rounded-sm p-3 flex-1 justify-between"
            @click="isFiltersOpen = false"
          >
            Aplica filtrele
          </UButton>
          <UButton
            v-if="activeFilterCount > 0"
            color="error"
            variant="subtle"
            icon="i-lucide-rotate-ccw"
            aria-label="Sterge filtrele"
            class="rounded-sm p-3 aspect-square justify-center"
            @click="resetFilters"
          />
        </div>
      </template>
    </USlideover>

    <div v-if="status === 'pending'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-4">
        <ProductCardSkeleton v-for="i in limit" :key="i" />
    </div>
    <div v-else-if="products?.length" class="space-y-8">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-4">
            <ProductCard
                v-for="product in products"
                :key="product.id"
                :to="`/c/${product.category?.slug || 'toate'}/${product.slug}`"
                :product="product"
            />
        </div>

        <div class="flex justify-center">
            <UPagination
                v-model:page="page"
                :total="total"
                :items-per-page="limit"
            />
        </div>
    </div>
    <div v-else class="text-center py-12 text-gray-500">
        {{ emptyMessage }}
    </div>
  </UContainer>
</template>
