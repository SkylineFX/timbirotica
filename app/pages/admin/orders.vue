<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { shippingMethodLabel, paymentMethodLabel } from '~~/shared/constants/order'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const toast = useToast()

const page = ref(1)
const limit = 25
const statusFilter = ref<OrderStatus | undefined>(undefined)
const searchQuery = ref('')
const debouncedQuery = ref('')

type DateRange = 'all' | 'today' | '7d' | '30d'
const dateRange = ref<DateRange>('all')
const dateRangeOptions: Array<{ label: string; value: DateRange }> = [
  { label: 'Toate datele', value: 'all' },
  { label: 'Astazi', value: 'today' },
  { label: 'Ultimele 7 zile', value: '7d' },
  { label: 'Ultimele 30 zile', value: '30d' },
]

const sortBy = ref<'createdAt' | 'total'>('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(col: 'createdAt' | 'total') {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortDir.value = 'desc'
  }
  page.value = 1
}

function rangeFrom(range: DateRange): string | undefined {
  if (range === 'all') return undefined
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (range === '7d') d.setDate(d.getDate() - 6)
  else if (range === '30d') d.setDate(d.getDate() - 29)
  return d.toISOString()
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (v) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = v.trim()
    page.value = 1
  }, 300)
})

watch([statusFilter, dateRange], () => { page.value = 1 })

const query = computed(() => ({
  page: page.value,
  limit,
  sortBy: sortBy.value,
  sortDir: sortDir.value,
  ...(statusFilter.value ? { status: statusFilter.value } : {}),
  ...(debouncedQuery.value ? { q: debouncedQuery.value } : {}),
  ...(rangeFrom(dateRange.value) ? { from: rangeFrom(dateRange.value) } : {}),
}))

const { data, pending, refresh } = await useFetch('/api/admin/orders', { query })
const { refresh: refreshPendingCount } = usePendingOrders()

const orders = computed(() => data.value?.orders ?? [])
const total = computed(() => data.value?.total ?? 0)

const statusOptions = ORDER_STATUS_VALUES.map(s => ({ label: ORDER_STATUS_LABEL[s], value: s }))

function resetFilters() {
  statusFilter.value = undefined
  searchQuery.value = ''
  debouncedQuery.value = ''
  dateRange.value = 'all'
  sortBy.value = 'createdAt'
  sortDir.value = 'desc'
  page.value = 1
}

// Modal
const isModalOpen = ref(false)
const selectedOrder = ref<any>(null)
const parsedShipping = ref<any>({})
const parsedBilling = ref<any>({})
const newStatus = ref<OrderStatus | undefined>(undefined)
const isSavingStatus = ref(false)

function openOrder(order: any) {
  selectedOrder.value = order
  newStatus.value = order.status
  try { parsedShipping.value = JSON.parse(order.shippingAddressSnapshot || '{}') } catch { parsedShipping.value = {} }
  try { parsedBilling.value = JSON.parse(order.billingAddressSnapshot || '{}') } catch { parsedBilling.value = {} }
  isModalOpen.value = true
}

async function saveStatus() {
  if (!selectedOrder.value || newStatus.value === selectedOrder.value.status) return
  isSavingStatus.value = true
  try {
    const updated = await $fetch<{ status: OrderStatus }>(`/api/admin/orders/${selectedOrder.value.id}`, {
      method: 'PATCH',
      body: { status: newStatus.value }
    })
    selectedOrder.value.status = updated.status
    await Promise.all([refresh(), refreshPendingCount()])
    toast.add({ title: 'Status actualizat', description: ORDER_STATUS_LABEL[updated.status as keyof typeof ORDER_STATUS_LABEL], color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Eroare', description: e?.data?.message ?? 'Nu am putut actualiza statusul.', color: 'error' })
  } finally {
    isSavingStatus.value = false
  }
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'orderNumber', header: '# Comanda' },
  { accessorKey: 'customer', header: 'Client' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Data' },
  { accessorKey: 'actions', header: '' },
]

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto w-full h-full flex flex-col min-h-0">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
      <h1 class="text-2xl font-semibold font-serif">Comenzi</h1>
      <p class="text-sm text-gray-500">{{ total }} {{ total === 1 ? 'comanda' : 'comenzi' }}</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-md p-4 mb-4 flex flex-wrap items-center gap-3 flex-shrink-0">
      <UInput
        v-model="searchQuery"
        placeholder="Cauta dupa numar comanda sau nume client..."
        icon="i-lucide-search"
        class="flex-1 min-w-[260px]"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        placeholder="Status"
        class="w-44"
      />
      <USelect
        v-model="dateRange"
        :items="dateRangeOptions"
        class="w-44"
      />
      <UButton variant="ghost" color="neutral" icon="i-lucide-rotate-ccw" @click="resetFilters">
        Reseteaza
      </UButton>
    </div>

    <div class="bg-white border border-gray-200 rounded-md overflow-hidden flex-1 min-h-0 flex flex-col">
      <UTable
        :data="orders"
        :columns="columns"
        :loading="pending"
        sticky
        :ui="{ root: 'flex-1 min-h-0', tr: 'cursor-pointer hover:bg-stone-50 transition-colors' }"
        :on-select="(_e: Event, row: any) => openOrder(row.original)"
      >
        <template #total-header>
          <button class="inline-flex items-center gap-1 hover:text-primary transition-colors" @click="toggleSort('total')">
            Total
            <UIcon :name="sortBy === 'total' ? (sortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="size-3.5" :class="sortBy === 'total' ? 'text-primary' : 'text-gray-400'" />
          </button>
        </template>
        <template #createdAt-header>
          <button class="inline-flex items-center gap-1 hover:text-primary transition-colors" @click="toggleSort('createdAt')">
            Data
            <UIcon :name="sortBy === 'createdAt' ? (sortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="size-3.5" :class="sortBy === 'createdAt' ? 'text-primary' : 'text-gray-400'" />
          </button>
        </template>
        <template #orderNumber-cell="{ row }">
          <span class="font-mono text-sm font-medium">#{{ row.original.orderNumber }}</span>
        </template>
        <template #customer-cell="{ row }">
          <div class="text-sm">
            <p class="text-gray-900">{{ row.original.user?.firstName }} {{ row.original.user?.lastName }}</p>
            <p class="text-gray-500 text-xs">{{ row.original.user?.email }}</p>
          </div>
        </template>
        <template #total-cell="{ row }">
          <span class="font-medium">{{ row.original.total.toFixed(2) }} RON</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="ORDER_STATUS_COLOR[row.original.status as keyof typeof ORDER_STATUS_COLOR] ?? 'neutral'" variant="subtle" size="sm">
            {{ ORDER_STATUS_LABEL[row.original.status as keyof typeof ORDER_STATUS_LABEL] ?? row.original.status }}
          </UBadge>
        </template>
        <template #createdAt-cell="{ row }">
          <span class="text-sm text-gray-600">{{ fmtDate(row.original.createdAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-chevron-right" @click.stop="openOrder(row.original)" />
        </template>
      </UTable>

      <div v-if="!pending && orders.length === 0" class="py-12 text-center text-sm text-gray-500 flex-shrink-0">
        Nicio comanda gasita.
      </div>
    </div>

    <div v-if="total > limit" class="mt-4 flex justify-center flex-shrink-0">
      <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
    </div>

    <!-- Order Details Modal -->
    <UModal v-model:open="isModalOpen" title="Detalii comanda" :ui="{ content: 'rounded-md sm:max-w-3xl' }">
      <template #body>
        <div v-if="selectedOrder" class="px-2 space-y-6">
          <div class="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <h4 class="font-bold text-gray-900 text-xl tracking-tight">#{{ selectedOrder.orderNumber }}</h4>
              <p class="text-sm text-gray-500 mt-0.5">Plasata pe {{ fmtDate(selectedOrder.createdAt) }}</p>
              <p class="text-sm text-gray-700 mt-1">{{ selectedOrder.user?.firstName }} {{ selectedOrder.user?.lastName }} · {{ selectedOrder.user?.email }}</p>
            </div>
            <UBadge :color="ORDER_STATUS_COLOR[selectedOrder.status as keyof typeof ORDER_STATUS_COLOR] ?? 'neutral'" variant="subtle" size="sm">
              {{ ORDER_STATUS_LABEL[selectedOrder.status as keyof typeof ORDER_STATUS_LABEL] ?? selectedOrder.status }}
            </UBadge>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50/70 p-4 rounded-sm border border-gray-100">
              <div class="flex justify-between mb-2">
                <h5 class="text-sm font-bold text-gray-900 flex items-center gap-1.5"><UIcon name="i-lucide-truck" class="w-4 h-4"/> Livrare</h5>
                <UBadge color="primary" variant="subtle" size="sm">{{ shippingMethodLabel(selectedOrder.shippingMethod) }}</UBadge>
              </div>
              <template v-if="selectedOrder.shippingMethod === 'courier' && parsedShipping.firstName">
                <p class="font-medium text-sm text-gray-900">{{ parsedShipping.firstName }} {{ parsedShipping.lastName }} · {{ parsedShipping.phone }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ parsedShipping.street }}, {{ parsedShipping.city }}, {{ parsedShipping.county }}</p>
              </template>
              <template v-else>
                <p class="text-sm text-gray-600">Ridicare personala de la sediu.</p>
              </template>
            </div>

            <div class="bg-gray-50/70 p-4 rounded-sm border border-gray-100">
              <div class="flex justify-between mb-2">
                <h5 class="text-sm font-bold text-gray-900 flex items-center gap-1.5"><UIcon name="i-lucide-receipt-text" class="w-4 h-4"/> Facturare</h5>
                <UBadge color="primary" variant="subtle" size="sm">{{ paymentMethodLabel(selectedOrder.paymentMethod) }}</UBadge>
              </div>
              <template v-if="parsedBilling.companyName">
                <p class="font-medium text-sm text-gray-900">{{ parsedBilling.companyName }}<template v-if="parsedBilling.onrc"> · {{ parsedBilling.onrc }}</template></p>
                <p class="text-sm text-gray-600 mt-1">{{ parsedBilling.hasRo ? 'RO' : '' }}{{ parsedBilling.cui }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ parsedBilling.street }}, {{ parsedBilling.city }}, {{ parsedBilling.county }}</p>
                <!-- Contact phone for the company billing — prefer the billing record's own phone; fall back to the account phone for legacy rows. -->
                <p v-if="parsedBilling.phone || selectedOrder.user?.phone" class="text-sm text-gray-600 mt-1">Telefon: {{ parsedBilling.phone || selectedOrder.user.phone }}</p>
              </template>
              <template v-else-if="parsedBilling.firstName">
                <p class="font-medium text-sm text-gray-900">{{ parsedBilling.firstName }} {{ parsedBilling.lastName }}<template v-if="parsedBilling.phone"> · {{ parsedBilling.phone }}</template></p>
                <p class="text-sm text-gray-600 mt-1">{{ parsedBilling.street }}, {{ parsedBilling.city }}, {{ parsedBilling.county }}</p>
              </template>
              <template v-else-if="selectedOrder.user">
                <p class="font-medium text-sm text-gray-900">{{ selectedOrder.user.firstName }} {{ selectedOrder.user.lastName }}<template v-if="selectedOrder.user.phone"> · {{ selectedOrder.user.phone }}</template></p>
                <p class="text-sm text-gray-600 mt-1">{{ selectedOrder.user.email }}</p>
              </template>
            </div>
          </div>

          <div class="space-y-3">
            <h5 class="font-semibold text-gray-900">Produse</h5>
            <div v-for="item in selectedOrder.items" :key="item.id" class="flex gap-4 py-3 border-b border-gray-100 last:border-0">
              <div class="w-14 h-14 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                <img v-if="item.product?.images?.[0]" :src="item.product.images[0]" :alt="item.product.name" class="w-full h-full object-contain p-1" />
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-100/50">
                  <UIcon name="i-lucide-image" class="w-5 h-5 text-gray-300" />
                </div>
              </div>
              <div class="flex flex-1 min-w-0 flex-col justify-between">
                <p class="font-medium text-gray-900 line-clamp-1">{{ item.product?.name ?? 'Produs indisponibil' }}</p>
                <div class="flex justify-between items-center">
                  <p class="text-sm text-gray-500">Cantitate: {{ item.quantity }}</p>
                  <p class="font-medium text-gray-900">{{ (item.priceAtBuy * item.quantity).toFixed(2) }} RON</p>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 border-dashed pt-4">
            <div class="flex justify-between items-center mb-1">
              <p class="text-gray-600">Subtotal</p>
              <p class="font-medium text-gray-900">{{ (selectedOrder.total - selectedOrder.shippingCost).toFixed(2) }} RON</p>
            </div>
            <div class="flex justify-between items-center mb-1">
              <p class="text-gray-600">Livrare</p>
              <p class="font-medium text-gray-900">{{ selectedOrder.shippingCost.toFixed(2) }} RON</p>
            </div>
            <div class="flex justify-between items-center pt-1">
              <p class="font-bold text-gray-900">Total</p>
              <p class="font-bold text-gray-900 text-xl">{{ selectedOrder.total.toFixed(2) }} RON</p>
            </div>
          </div>

          <!-- Status updater -->
          <div class="bg-stone-50 p-4 rounded-sm border border-gray-100">
            <h5 class="text-sm font-bold text-gray-900 mb-3">Schimba statusul</h5>
            <div class="flex gap-3">
              <USelect
                v-model="newStatus"
                :items="ORDER_STATUS_VALUES.map(s => ({ label: ORDER_STATUS_LABEL[s], value: s }))"
                class="flex-1"
              />
              <UButton
                color="primary"
                :loading="isSavingStatus"
                :disabled="newStatus === selectedOrder.status"
                @click="saveStatus"
              >Salveaza</UButton>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <UButton
              icon="i-lucide-download"
              color="neutral"
              variant="soft"
              class="flex-1 justify-center"
              :to="`/api/admin/orders/${selectedOrder.id}/proforma`"
              external
              download
            >Descarca proforma</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
