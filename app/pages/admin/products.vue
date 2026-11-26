<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { productPriceSchema } from '~~/shared/schemas/product'
import { isSearchLongEnough } from '~~/shared/utils/search'
import { fetchFailure } from '~~/shared/utils/fetchFailure'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const toast = useToast()

const page = ref(1)
const limit = 25
const searchQuery = ref('')
const debouncedQuery = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (v) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = v.trim()
    page.value = 1
  }, 300)
})

const query = computed(() => ({
  page: page.value,
  limit,
  ...(debouncedQuery.value ? { q: debouncedQuery.value } : {})
}))

const { data, pending, error, refresh } = await useFetch('/api/admin/products', { query })
const products = computed(() => data.value?.products ?? [])
const total = computed(() => data.value?.total ?? 0)

// One product row of GET /api/admin/products.
type AdminProduct = (typeof products.value)[number]

// Per-row UI state for price editing — local edits, persist on blur
const priceDrafts = ref<Record<number, string>>({})
const savingId = ref<number | null>(null)

function priceFor(p: AdminProduct): string {
  return priceDrafts.value[p.id] ?? p.price.toFixed(2)
}

async function saveStock(p: AdminProduct, available: boolean) {
  const newStock = available ? 1 : 0
  if (p.stock === newStock) return
  savingId.value = p.id
  try {
    await $fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { stock: newStock } })
    await refresh()
    toast.add({ title: available ? 'Produs disponibil' : 'Produs indisponibil', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Eroare',
      description: fetchFailure(e).message ?? 'Nu am putut actualiza stocul.',
      color: 'error'
    })
  } finally {
    savingId.value = null
  }
}

async function savePrice(p: AdminProduct) {
  const draft = priceDrafts.value[p.id]
  if (draft === undefined) return
  const parsed = parseFloat(draft)
  // The same rule the server applies: above 0, at most two decimals.
  const check = productPriceSchema.safeParse(parsed)
  if (!check.success) {
    toast.add({
      title: 'Pret invalid',
      description: check.error.issues[0]?.message,
      color: 'error'
    })
    delete priceDrafts.value[p.id]
    return
  }
  if (parsed === p.price) {
    delete priceDrafts.value[p.id]
    return
  }
  savingId.value = p.id
  try {
    await $fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { price: parsed } })
    delete priceDrafts.value[p.id]
    await refresh()
    toast.add({
      title: 'Pret actualizat',
      description: `${parsed.toFixed(2)} RON`,
      color: 'success'
    })
  } catch (e) {
    toast.add({
      title: 'Eroare',
      description: fetchFailure(e).message ?? 'Nu am putut actualiza pretul.',
      color: 'error'
    })
  } finally {
    savingId.value = null
  }
}

const columns: TableColumn<AdminProduct>[] = [
  { accessorKey: 'image', header: '' },
  { accessorKey: 'name', header: 'Nume' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'category', header: 'Categorie' },
  { accessorKey: 'price', header: 'Pret (RON)' },
  { accessorKey: 'stock', header: 'Disponibil' }
]
</script>

<template>
  <div class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col">
    <div class="mb-6 flex flex-shrink-0 items-center justify-between">
      <h1 class="font-serif text-2xl font-semibold">Produse</h1>
      <p v-if="!error" class="text-sm text-gray-500">
        {{ total }} {{ total === 1 ? 'produs' : 'produse' }}
      </p>
    </div>

    <div
      class="mb-4 flex flex-shrink-0 flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-4"
    >
      <UInput
        v-model="searchQuery"
        placeholder="Cauta dupa nume sau SKU..."
        icon="i-lucide-search"
        class="min-w-[260px] flex-1"
      />
    </div>

    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white"
    >
      <UTable
        :data="products"
        :columns="columns"
        :loading="pending"
        sticky
        :ui="{ root: 'flex-1 min-h-0' }"
      >
        <!-- Hidden title: an empty one ('') breaks hydration in UTable and leaves the column unnamed for screen readers. -->
        <!-- What the table shows instead of rows: a load error, the search minimum, or no match. -->
        <template #empty>
          <div v-if="error" class="space-y-3">
            <p>Nu am putut incarca produsele.</p>
            <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="refresh()"
              >Reincearca</UButton
            >
          </div>
          <span v-else-if="!pending">{{
            debouncedQuery && !isSearchLongEnough(debouncedQuery)
              ? 'Scrie cel putin 2 caractere.'
              : 'Niciun produs gasit.'
          }}</span>
        </template>
        <template #image-header>
          <span class="sr-only">Imagine</span>
        </template>
        <template #image-cell="{ row }">
          <NuxtLink
            :to="`/c/${row.original.category?.slug ?? 'toate'}/${row.original.slug}`"
            target="_blank"
            class="block flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-gray-100 bg-stone-50 transition-colors hover:border-primary"
          >
            <img
              v-if="row.original.images?.[0]"
              :src="row.original.images[0]"
              :alt="row.original.name"
              loading="lazy"
              class="h-full w-full object-contain p-1"
            />
            <UIcon v-else name="i-lucide-image" class="h-5 w-5 text-gray-300" />
          </NuxtLink>
        </template>
        <template #name-cell="{ row }">
          <div class="max-w-[280px] text-sm">
            <NuxtLink
              :to="`/c/${row.original.category?.slug ?? 'toate'}/${row.original.slug}`"
              target="_blank"
              class="block truncate font-medium text-gray-900 transition-colors hover:text-primary"
              :title="row.original.name"
            >
              {{ row.original.name }}
            </NuxtLink>
            <p class="truncate text-xs text-gray-500">{{ row.original.brand?.name }}</p>
          </div>
        </template>
        <template #sku-cell="{ row }">
          <span class="font-mono text-sm text-gray-600">{{ row.original.sku || '—' }}</span>
        </template>
        <template #category-cell="{ row }">
          <span class="text-sm text-gray-600">{{ row.original.category?.name || '—' }}</span>
        </template>
        <template #price-cell="{ row }">
          <UInput
            :model-value="priceFor(row.original)"
            type="number"
            step="0.01"
            min="0"
            size="sm"
            class="w-28"
            :loading="savingId === row.original.id"
            @update:model-value="(v: string | number) => (priceDrafts[row.original.id] = String(v))"
            @blur="savePrice(row.original)"
            @keydown.enter="savePrice(row.original)"
          />
        </template>
        <template #stock-cell="{ row }">
          <USwitch
            :model-value="row.original.stock > 0"
            :loading="savingId === row.original.id"
            @update:model-value="(v: boolean) => saveStock(row.original, v)"
          />
        </template>
      </UTable>
    </div>

    <div v-if="total > limit" class="mt-4 flex flex-shrink-0 justify-center">
      <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
    </div>
  </div>
</template>
