<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

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
  ...(debouncedQuery.value ? { q: debouncedQuery.value } : {}),
}))

const { data, pending, refresh } = await useFetch('/api/admin/products', { query })
const products = computed(() => data.value?.products ?? [])
const total = computed(() => data.value?.total ?? 0)

// Per-row UI state for price editing — local edits, persist on blur
const priceDrafts = ref<Record<number, string>>({})
const savingId = ref<number | null>(null)

function priceFor(p: any): string {
  return priceDrafts.value[p.id] ?? p.price.toFixed(2)
}

async function saveStock(p: any, available: boolean) {
  const newStock = available ? 1 : 0
  if (p.stock === newStock) return
  savingId.value = p.id
  try {
    await $fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { stock: newStock } })
    await refresh()
    toast.add({ title: available ? 'Produs disponibil' : 'Produs indisponibil', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Eroare', description: e?.data?.message ?? 'Nu am putut actualiza stocul.', color: 'error' })
  } finally {
    savingId.value = null
  }
}

async function savePrice(p: any) {
  const draft = priceDrafts.value[p.id]
  if (draft === undefined) return
  const parsed = parseFloat(draft)
  if (isNaN(parsed) || parsed <= 0) {
    toast.add({ title: 'Pret invalid', description: 'Pretul trebuie sa fie mai mare decat 0.', color: 'error' })
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
    toast.add({ title: 'Pret actualizat', description: `${parsed.toFixed(2)} RON`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Eroare', description: e?.data?.message ?? 'Nu am putut actualiza pretul.', color: 'error' })
  } finally {
    savingId.value = null
  }
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'image', header: '' },
  { accessorKey: 'name', header: 'Nume' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'category', header: 'Categorie' },
  { accessorKey: 'price', header: 'Pret (RON)' },
  { accessorKey: 'stock', header: 'Disponibil' },
]
</script>

<template>
  <div class="max-w-7xl mx-auto w-full h-full flex flex-col min-h-0">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
      <h1 class="text-2xl font-semibold font-serif">Produse</h1>
      <p class="text-sm text-gray-500">{{ total }} {{ total === 1 ? 'produs' : 'produse' }}</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-md p-4 mb-4 flex flex-wrap items-center gap-3 flex-shrink-0">
      <UInput
        v-model="searchQuery"
        placeholder="Cauta dupa nume sau SKU..."
        icon="i-lucide-search"
        class="flex-1 min-w-[260px]"
      />
    </div>

    <div class="bg-white border border-gray-200 rounded-md overflow-hidden flex-1 min-h-0 flex flex-col">
      <UTable
        :data="products"
        :columns="columns"
        :loading="pending"
        sticky
        :ui="{ root: 'flex-1 min-h-0' }"
      >
        <template #image-cell="{ row }">
          <NuxtLink :to="`/c/${row.original.category?.slug ?? 'toate'}/${row.original.slug}`" target="_blank" class="block w-12 h-12 bg-stone-50 rounded-md border border-gray-100 overflow-hidden flex items-center justify-center hover:border-primary transition-colors">
            <img v-if="row.original.images?.[0]" :src="row.original.images[0]" :alt="row.original.name" class="w-full h-full object-contain p-1" />
            <UIcon v-else name="i-lucide-image" class="w-5 h-5 text-gray-300" />
          </NuxtLink>
        </template>
        <template #name-cell="{ row }">
          <div class="text-sm max-w-[280px]">
            <NuxtLink :to="`/c/${row.original.category?.slug ?? 'toate'}/${row.original.slug}`" target="_blank" class="font-medium text-gray-900 truncate hover:text-primary transition-colors block" :title="row.original.name">
              {{ row.original.name }}
            </NuxtLink>
            <p class="text-xs text-gray-500 truncate">{{ row.original.brand?.name }}</p>
          </div>
        </template>
        <template #sku-cell="{ row }">
          <span class="text-sm font-mono text-gray-600">{{ row.original.sku || '—' }}</span>
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
            @update:model-value="(v: any) => priceDrafts[row.original.id] = String(v)"
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

      <div v-if="!pending && products.length === 0" class="py-12 text-center text-sm text-gray-500 flex-shrink-0">
        Niciun produs gasit.
      </div>
    </div>

    <div v-if="total > limit" class="mt-4 flex justify-center flex-shrink-0">
      <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
    </div>
  </div>
</template>
