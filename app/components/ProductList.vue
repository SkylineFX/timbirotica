<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { LocationQueryRaw } from 'vue-router'

const props = defineProps<{
  title: string
  subtitle?: string
  // What the page lists, sent to GET /api/products: q, category, brand or recommended.
  apiQuery: Record<string, string>
  emptyMessage: string
  breadcrumbs?: BreadcrumbItem[]
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

// Search results start sorted by relevance (the API's default when there is a
// search); other listings start with the newest products.
const isSearch = computed(() => !!props.apiQuery.q)

const sortOptions = computed(() => [
  ...(isSearch.value ? [{ label: 'Relevanta', value: 'relevance' }] : []),
  { label: 'Cele mai noi', value: 'default' },
  { label: 'Pret crescator', value: 'price-asc' },
  { label: 'Pret descrescator', value: 'price-desc' },
  { label: 'Nume: A-Z', value: 'name-asc' },
  { label: 'Nume: Z-A', value: 'name-desc' }
])

const sort = computed({
  get: () => (route.query.sort as string) || (isSearch.value ? 'relevance' : 'default'),
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

const { data, status, error, refresh } = await useFetch('/api/products', {
  query: fetchQuery,
  watch: [fetchQuery]
})

// A failed load is an error, not an empty list. During server rendering the
// page gets the real status code, so search engines don't index "0 produse";
// in the browser (a filter or page change) the list offers a retry.
if (import.meta.server && error.value) {
  throw createError({ statusCode: error.value.statusCode ?? 500, fatal: true })
}

const products = computed(() => data.value?.products || [])
const total = computed(() => data.value?.total || 0)
const facets = computed(
  () => data.value?.facets || { price: null, brands: null, subcategories: null }
)

const normalizePriceQuery = () => {
  const priceFacet = facets.value.price
  if (!priceFacet || priceFacet.min >= priceFacet.max) return
  const { min, max } = priceFacet

  const rawMin = route.query.minPrice
  const rawMax = route.query.maxPrice
  if (rawMin == null && rawMax == null) return

  const parsedMin = rawMin != null && rawMin !== '' ? Number(rawMin) : null
  const parsedMax = rawMax != null && rawMax !== '' ? Number(rawMax) : null

  let nextMin: typeof rawMin | undefined = rawMin
  let nextMax: typeof rawMax | undefined = rawMax

  if (parsedMin !== null && (!Number.isFinite(parsedMin) || parsedMin <= min || parsedMin > max))
    nextMin = undefined
  if (parsedMax !== null && (!Number.isFinite(parsedMax) || parsedMax >= max || parsedMax < min))
    nextMax = undefined
  if (
    nextMin !== undefined &&
    nextMax !== undefined &&
    parsedMin !== null &&
    parsedMax !== null &&
    Number.isFinite(parsedMin) &&
    Number.isFinite(parsedMax) &&
    parsedMin > parsedMax
  ) {
    nextMin = undefined
    nextMax = undefined
  }

  if (nextMin === rawMin && nextMax === rawMax) return

  const next: LocationQueryRaw = { ...route.query, minPrice: nextMin, maxPrice: nextMax }
  for (const k of Object.keys(next)) {
    if (next[k] === undefined || next[k] === '') delete next[k]
  }
  return navigateTo({ query: next }, { replace: true })
}

watch(
  () => [
    facets.value.price?.min,
    facets.value.price?.max,
    route.query.minPrice,
    route.query.maxPrice
  ],
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
  navigateTo({
    query: {
      ...route.query,
      minPrice: undefined,
      maxPrice: undefined,
      available: undefined,
      sub: undefined,
      b: undefined,
      page: 1
    }
  })
}
</script>

<template>
  <UContainer class="py-6">
    <UBreadcrumb
      v-if="breadcrumbs?.length"
      :items="breadcrumbs"
      :ui="{ separatorIcon: 'w-4 h-4' }"
      class="mb-6 [&_li]:shrink-0 [&_li:last-child]:min-w-0 [&_li:last-child]:shrink-1 [&_ol]:flex-nowrap [&_ol]:overflow-hidden"
    />
    <div class="mb-8 flex flex-col gap-4 rounded-md bg-white p-4">
      <h1 class="flex flex-wrap items-baseline gap-2 text-xl font-bold wrap-anywhere xl:text-2xl">
        {{ title }} <span v-if="subtitle" class="font-normal italic">"{{ subtitle }}"</span>
        <span
          v-if="total !== undefined && !error"
          class="text-sm font-medium text-gray-500 normal-case"
        >
          ({{ total }} produse)
        </span>
      </h1>
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center xl:gap-4">
        <div class="flex w-full gap-2">
          <div class="flex flex-1 items-center gap-2 sm:flex-none">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-sliders-horizontal"
              class="w-full rounded-sm sm:w-auto sm:text-sm"
              size="lg"
              @click="
                () => {
                  isFiltersOpen = true
                }
              "
            >
              <span class="flex w-full items-center justify-between gap-2"
                >Filtreaza
                <UBadge
                  v-if="activeFilterCount > 0"
                  color="primary"
                  variant="solid"
                  class="ml-1 flex h-5 w-5 items-center justify-center rounded-sm p-0 text-xs"
                >
                  {{ activeFilterCount }}
                </UBadge>
              </span>
            </UButton>
          </div>
          <div class="flex flex-1 items-center justify-between gap-2 sm:ml-auto sm:flex-none">
            <p class="hidden text-sm font-medium text-gray-500 md:block">Sorteaza dupa:</p>
            <USelect
              v-model="sort"
              :items="sortOptions"
              value-key="value"
              label-key="label"
              size="lg"
              class="w-full rounded-sm sm:w-36"
            />
          </div>
        </div>

        <div class="hidden items-center gap-2 md:flex">
          <p class="text-sm font-medium text-gray-500">Produse:</p>
          <USelect
            v-model="limit"
            :items="limitOptions"
            value-key="value"
            label-key="label"
            size="lg"
            class="w-36 rounded-sm"
          />
        </div>
      </div>
    </div>

    <USlideover v-model:open="isFiltersOpen" side="left" title="Filtre">
      <template #body>
        <ProductFilters :facets="facets" :hide-brand="hideBrand" />
      </template>
      <template #footer>
        <div class="flex w-full gap-2">
          <UButton
            color="primary"
            variant="subtle"
            trailing-icon="i-lucide-arrow-right"
            block
            class="flex-1 justify-between rounded-sm p-3"
            @click="
              () => {
                isFiltersOpen = false
              }
            "
          >
            Aplica filtrele
          </UButton>
          <UButton
            v-if="activeFilterCount > 0"
            color="error"
            variant="subtle"
            icon="i-lucide-rotate-ccw"
            aria-label="Sterge filtrele"
            class="aspect-square justify-center rounded-sm p-3"
            @click="resetFilters"
          />
        </div>
      </template>
    </USlideover>

    <div
      v-if="status === 'pending'"
      class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5"
    >
      <ProductCardSkeleton v-for="i in limit" :key="i" />
    </div>
    <div v-else-if="error" class="space-y-4 py-12 text-center text-gray-500">
      <p>Nu am putut incarca produsele.</p>
      <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="refresh()"
        >Reincearca</UButton
      >
    </div>
    <div v-else-if="products?.length" class="space-y-8">
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :to="`/c/${product.category?.slug || 'toate'}/${product.slug}`"
          :product="product"
        />
      </div>

      <div class="flex justify-center">
        <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
      </div>
    </div>
    <div v-else class="py-12 text-center wrap-anywhere text-gray-500">
      {{ emptyMessage }}
    </div>
  </UContainer>
</template>
