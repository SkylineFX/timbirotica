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

const { data, status, refresh } = await useFetch('/api/products', {
    query: fetchQuery,
    watch: [fetchQuery]
})

const products = computed(() => data.value?.products || [])
const total = computed(() => data.value?.total || 0)
const facets = computed(() => data.value?.facets || { price: null, brands: null, subcategories: null })

const hideBrand = computed(() => !!props.apiQuery.brand)
const hideSubcategory = computed(() => !props.apiQuery.category)

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
</script>

<template>
  <UContainer class="py-6">
    <UBreadcrumb v-if="breadcrumbs?.length" :items="breadcrumbs" :ui="{ separatorIcon: 'w-4 h-4' }" class="mb-6 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_li]:shrink-0 [&_li:last-child]:shrink-1 [&_li:last-child]:min-w-0" />
    <div class="flex flex-col mb-8 gap-4 rounded-lg p-4 bg-white">
      <h1 class="text-xl font-bold flex flex-wrap items-baseline gap-2 xl:text-2xl">
        {{ title }} <span v-if="subtitle" class="font-normal italic">"{{ subtitle }}"</span>
        <span v-if="total !== undefined" class="text-sm font-medium text-gray-500 normal-case">
          ({{ total }} produse)
        </span>
      </h1>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 xl:gap-4">
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-sliders-horizontal"
            class="rounded-sm"
            @click="isFiltersOpen = true"
          >
            Filtre
            <UBadge v-if="activeFilterCount > 0" color="primary" variant="solid" class="rounded-sm ml-1">
              {{ activeFilterCount }}
            </UBadge>
          </UButton>
        </div>
        <div class="flex items-center justify-between gap-2 sm:ml-auto">
          <p class="text-sm font-medium text-gray-500">Sorteaza dupa:</p>
          <USelect v-model="sort" :items="sortOptions" value-key="value" label-key="label" class="w-36" />
        </div>
        <div class="hidden md:flex items-center gap-2">
           <p class="text-sm font-medium text-gray-500">Produse:</p>
           <USelect v-model="limit" :items="limitOptions" value-key="value" label-key="label" class="w-36" />
        </div>
      </div>
    </div>

    <USlideover v-model:open="isFiltersOpen" side="right" title="Filtre">
      <template #body>
        <ProductFilters
          :facets="facets"
          :hide-brand="hideBrand"
          :hide-subcategory="hideSubcategory"
        />
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
