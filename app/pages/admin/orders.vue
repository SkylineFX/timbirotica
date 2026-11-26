<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import {
  shippingMethodLabel,
  paymentMethodLabel,
  ORDER_STATUS_TRANSITIONS
} from '~~/shared/constants/order'
import { formatShopDateTime } from '~~/shared/utils/format'
import { fetchFailure } from '~~/shared/utils/fetchFailure'
import type { BillingAddressSnapshot, ShippingAddressSnapshot } from '~~/shared/types/account'

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
  { label: 'Ultimele 30 zile', value: '30d' }
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

watch([statusFilter, dateRange], () => {
  page.value = 1
})

const query = computed(() => ({
  page: page.value,
  limit,
  sortBy: sortBy.value,
  sortDir: sortDir.value,
  ...(statusFilter.value ? { status: statusFilter.value } : {}),
  ...(debouncedQuery.value ? { q: debouncedQuery.value } : {}),
  ...(rangeFrom(dateRange.value) ? { from: rangeFrom(dateRange.value) } : {})
}))

const { data, pending, error, refresh } = await useFetch('/api/admin/orders', { query })
const { refresh: refreshPendingCount } = usePendingOrders()

const orders = computed(() => data.value?.orders ?? [])
const total = computed(() => data.value?.total ?? 0)

// One order row of GET /api/admin/orders, with its lines and customer.
type AdminOrder = (typeof orders.value)[number]

const statusOptions = ORDER_STATUS_VALUES.map((s) => ({ label: ORDER_STATUS_LABEL[s], value: s }))

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
const selectedOrder = ref<AdminOrder | null>(null)
const parsedShipping = ref<ShippingAddressSnapshot>({})
const parsedBilling = ref<BillingAddressSnapshot>({})
const newStatus = ref<OrderStatus | undefined>(undefined)
const isSavingStatus = ref(false)

// The order's status and the ones it can move to from there.
const statusChoices = computed(() => {
  const current = selectedOrder.value?.status as OrderStatus | undefined
  if (!current) return []
  return [current, ...(ORDER_STATUS_TRANSITIONS[current] ?? [])].map((s) => ({
    label: ORDER_STATUS_LABEL[s] ?? s,
    value: s
  }))
})

function openOrder(order: AdminOrder) {
  selectedOrder.value = order
  // orders.status is a plain text column, so TypeScript can't know it only
  // ever holds an OrderStatus (the server writes nothing else).
  newStatus.value = order.status as OrderStatus
  try {
    parsedShipping.value = JSON.parse(order.shippingAddressSnapshot || '{}')
  } catch {
    parsedShipping.value = {}
  }
  try {
    parsedBilling.value = JSON.parse(order.billingAddressSnapshot || '{}')
  } catch {
    parsedBilling.value = {}
  }
  isModalOpen.value = true
}

async function saveStatus() {
  if (!selectedOrder.value || newStatus.value === selectedOrder.value.status) return
  isSavingStatus.value = true
  try {
    const updated = await $fetch<{ status: OrderStatus }>(
      `/api/admin/orders/${selectedOrder.value.id}`,
      {
        method: 'PATCH',
        body: { status: newStatus.value }
      }
    )
    selectedOrder.value.status = updated.status
    await Promise.all([refresh(), refreshPendingCount()])
    toast.add({
      title: 'Status actualizat',
      description: ORDER_STATUS_LABEL[updated.status as keyof typeof ORDER_STATUS_LABEL],
      color: 'success'
    })
  } catch (e) {
    const failure = fetchFailure(e)
    toast.add({
      title: 'Eroare',
      description: failure.message ?? 'Nu am putut actualiza statusul.',
      color: 'error'
    })
    // The order may have changed meanwhile (a customer cancelled it): reload
    // the list and show the order's current status and choices in the modal.
    // A status filter can drop the order from the list, so the status the
    // endpoint sends back with the error is the fallback.
    await Promise.all([refresh(), refreshPendingCount()])
    const current = orders.value.find((o) => o.id === selectedOrder.value?.id)
    const sentStatus = failure.data.status
    const status = current?.status ?? (typeof sentStatus === 'string' ? sentStatus : undefined)
    if (status && selectedOrder.value) {
      selectedOrder.value.status = status
      // A plain text column too, see openOrder.
      newStatus.value = status as OrderStatus
    }
  } finally {
    isSavingStatus.value = false
  }
}

const columns: TableColumn<AdminOrder>[] = [
  { accessorKey: 'orderNumber', header: '# Comanda' },
  { accessorKey: 'customer', header: 'Client' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Data' },
  { accessorKey: 'actions', header: '' }
]
</script>

<template>
  <div class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col">
    <div class="mb-6 flex flex-shrink-0 items-center justify-between">
      <h1 class="font-serif text-2xl font-semibold">Comenzi</h1>
      <p v-if="!error" class="text-sm text-gray-500">
        {{ total }} {{ total === 1 ? 'comanda' : 'comenzi' }}
      </p>
    </div>

    <div
      class="mb-4 flex flex-shrink-0 flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-4"
    >
      <UInput
        v-model="searchQuery"
        placeholder="Cauta dupa numar comanda sau nume client..."
        icon="i-lucide-search"
        class="min-w-[260px] flex-1"
      />
      <USelect v-model="statusFilter" :items="statusOptions" placeholder="Status" class="w-44" />
      <USelect v-model="dateRange" :items="dateRangeOptions" class="w-44" />
      <UButton variant="ghost" color="neutral" icon="i-lucide-rotate-ccw" @click="resetFilters">
        Reseteaza
      </UButton>
    </div>

    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white"
    >
      <UTable
        :data="orders"
        :columns="columns"
        :loading="pending"
        sticky
        :ui="{ root: 'flex-1 min-h-0', tr: 'cursor-pointer hover:bg-stone-50 transition-colors' }"
        :on-select="(_e: Event, row: TableRow<AdminOrder>) => openOrder(row.original)"
      >
        <template #total-header>
          <button
            class="inline-flex items-center gap-1 transition-colors hover:text-primary"
            @click="toggleSort('total')"
          >
            Total
            <UIcon
              :name="
                sortBy === 'total'
                  ? sortDir === 'asc'
                    ? 'i-lucide-arrow-up'
                    : 'i-lucide-arrow-down'
                  : 'i-lucide-arrow-up-down'
              "
              class="size-3.5"
              :class="sortBy === 'total' ? 'text-primary' : 'text-gray-400'"
            />
          </button>
        </template>
        <!-- What the table shows instead of rows: a load error or no match. -->
        <template #empty>
          <div v-if="error" class="space-y-3">
            <p>Nu am putut incarca comenzile.</p>
            <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="refresh()"
              >Reincearca</UButton
            >
          </div>
          <span v-else-if="!pending">Nicio comanda gasita.</span>
        </template>
        <template #createdAt-header>
          <button
            class="inline-flex items-center gap-1 transition-colors hover:text-primary"
            @click="toggleSort('createdAt')"
          >
            Data
            <UIcon
              :name="
                sortBy === 'createdAt'
                  ? sortDir === 'asc'
                    ? 'i-lucide-arrow-up'
                    : 'i-lucide-arrow-down'
                  : 'i-lucide-arrow-up-down'
              "
              class="size-3.5"
              :class="sortBy === 'createdAt' ? 'text-primary' : 'text-gray-400'"
            />
          </button>
        </template>
        <template #orderNumber-cell="{ row }">
          <span class="font-mono text-sm font-medium">#{{ row.original.orderNumber }}</span>
        </template>
        <template #customer-cell="{ row }">
          <div class="text-sm">
            <p class="text-gray-900">
              {{ row.original.user?.firstName }} {{ row.original.user?.lastName }}
            </p>
            <p class="text-xs text-gray-500">{{ row.original.user?.email }}</p>
          </div>
        </template>
        <template #total-cell="{ row }">
          <span class="font-medium">{{ row.original.total.toFixed(2) }} RON</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge
            :color="
              ORDER_STATUS_COLOR[row.original.status as keyof typeof ORDER_STATUS_COLOR] ??
              'neutral'
            "
            variant="subtle"
            size="sm"
          >
            {{
              ORDER_STATUS_LABEL[row.original.status as keyof typeof ORDER_STATUS_LABEL] ??
              row.original.status
            }}
          </UBadge>
        </template>
        <template #createdAt-cell="{ row }">
          <span class="text-sm text-gray-600">{{
            formatShopDateTime(row.original.createdAt)
          }}</span>
        </template>
        <!-- Hidden title: an empty one ('') breaks hydration in UTable and leaves the column unnamed for screen readers. -->
        <template #actions-header>
          <span class="sr-only">Actiuni</span>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-chevron-right"
            aria-label="Detalii comanda"
            @click.stop="openOrder(row.original)"
          />
        </template>
      </UTable>
    </div>

    <div v-if="total > limit" class="mt-4 flex flex-shrink-0 justify-center">
      <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
    </div>

    <!-- Order Details Modal -->
    <UModal
      v-model:open="isModalOpen"
      title="Detalii comanda"
      :ui="{ content: 'rounded-md sm:max-w-3xl' }"
    >
      <template #body>
        <div v-if="selectedOrder" class="space-y-6 px-2">
          <div class="flex items-start justify-between border-b border-gray-100 pb-4">
            <div>
              <h4 class="text-xl font-bold tracking-tight text-gray-900">
                #{{ selectedOrder.orderNumber }}
              </h4>
              <p class="mt-0.5 text-sm text-gray-500">
                Plasata pe {{ formatShopDateTime(selectedOrder.createdAt) }}
              </p>
              <p class="mt-1 text-sm text-gray-700">
                {{ selectedOrder.user?.firstName }} {{ selectedOrder.user?.lastName }} ·
                {{ selectedOrder.user?.email }}
              </p>
            </div>
            <UBadge
              :color="
                ORDER_STATUS_COLOR[selectedOrder.status as keyof typeof ORDER_STATUS_COLOR] ??
                'neutral'
              "
              variant="subtle"
              size="sm"
            >
              {{
                ORDER_STATUS_LABEL[selectedOrder.status as keyof typeof ORDER_STATUS_LABEL] ??
                selectedOrder.status
              }}
            </UBadge>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-sm border border-gray-100 bg-gray-50/70 p-4">
              <div class="mb-2 flex justify-between">
                <h5 class="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <UIcon name="i-lucide-truck" class="h-4 w-4" /> Livrare
                </h5>
                <UBadge color="primary" variant="subtle" size="sm">{{
                  shippingMethodLabel(selectedOrder.shippingMethod)
                }}</UBadge>
              </div>
              <template
                v-if="selectedOrder.shippingMethod === 'courier' && parsedShipping.firstName"
              >
                <p class="text-sm font-medium text-gray-900">
                  {{ parsedShipping.firstName }} {{ parsedShipping.lastName }} ·
                  {{ parsedShipping.phone }}
                </p>
                <p class="mt-1 text-sm text-gray-600">
                  {{ parsedShipping.street }}, {{ parsedShipping.city }},
                  {{ parsedShipping.county }}
                </p>
              </template>
              <template v-else>
                <p class="text-sm text-gray-600">Ridicare personala de la sediu.</p>
              </template>
            </div>

            <div class="rounded-sm border border-gray-100 bg-gray-50/70 p-4">
              <div class="flex justify-between">
                <h5 class="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <UIcon name="i-lucide-receipt-text" class="h-4 w-4" /> Facturare
                </h5>
                <UBadge color="primary" variant="subtle" size="sm">{{
                  paymentMethodLabel(selectedOrder.paymentMethod)
                }}</UBadge>
              </div>
              <div class="mt-2">
                <template v-if="parsedBilling.companyName">
                  <p class="text-sm font-medium text-gray-900">
                    {{ parsedBilling.companyName }} · {{ parsedBilling.hasRo ? 'RO ' : ''
                    }}{{ parsedBilling.cui }}
                  </p>
                  <p v-if="parsedBilling.onrc" class="mt-1 text-sm text-gray-600">
                    {{ parsedBilling.onrc }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-sm text-gray-600">
                    {{ parsedBilling.street }}, {{ parsedBilling.city }}, {{ parsedBilling.county }}
                  </p>
                  <!-- <p v-if="parsedBilling.phone" class="text-sm text-gray-600 mt-1">Telefon: {{ parsedBilling.phone }}</p> -->
                </template>
                <template v-else-if="parsedBilling.firstName">
                  <p class="text-sm font-medium text-gray-900">
                    {{ parsedBilling.firstName }} {{ parsedBilling.lastName }} ·
                    {{ parsedBilling.phone }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-sm text-gray-600">
                    {{ parsedBilling.street }}, {{ parsedBilling.city }}, {{ parsedBilling.county }}
                  </p>
                </template>
                <template v-else-if="selectedOrder.user">
                  <p class="text-sm font-medium text-gray-900">
                    {{ selectedOrder.user.firstName }} {{ selectedOrder.user.lastName
                    }}<template v-if="selectedOrder.user.phone">
                      · {{ selectedOrder.user.phone }}</template
                    >
                  </p>
                </template>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h5 class="font-semibold text-gray-900">Produse</h5>
            <div
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="flex gap-4 border-b border-gray-100 py-3 last:border-0"
            >
              <div
                class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white"
              >
                <img
                  v-if="item.product?.images?.[0]"
                  :src="item.product.images[0]"
                  :alt="item.product.name"
                  loading="lazy"
                  class="h-full w-full object-contain p-1"
                />
                <div v-else class="flex h-full w-full items-center justify-center bg-gray-100/50">
                  <UIcon name="i-lucide-image" class="h-5 w-5 text-gray-300" />
                </div>
              </div>
              <div class="flex min-w-0 flex-1 flex-col justify-between">
                <p class="line-clamp-1 font-medium text-gray-900">
                  {{ item.product?.name ?? 'Produs indisponibil' }}
                </p>
                <div class="flex items-center justify-between">
                  <p class="text-sm text-gray-500">Cantitate: {{ item.quantity }}</p>
                  <p class="font-medium text-gray-900">
                    {{ (item.priceAtBuy * item.quantity).toFixed(2) }} RON
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-dashed border-gray-200 pt-4">
            <div class="mb-1 flex items-center justify-between">
              <p class="text-gray-600">Subtotal</p>
              <p class="font-medium text-gray-900">
                {{ (selectedOrder.total - selectedOrder.shippingCost).toFixed(2) }} RON
              </p>
            </div>
            <div class="mb-1 flex items-center justify-between">
              <p class="text-gray-600">Livrare</p>
              <p class="font-medium text-gray-900">
                {{ selectedOrder.shippingCost.toFixed(2) }} RON
              </p>
            </div>
            <div class="flex items-center justify-between pt-1">
              <p class="font-bold text-gray-900">Total</p>
              <p class="text-xl font-bold text-gray-900">
                {{ selectedOrder.total.toFixed(2) }} RON
              </p>
            </div>
          </div>

          <!-- Status updater -->
          <div
            v-if="statusChoices.length > 1"
            class="rounded-sm border border-gray-100 bg-stone-50 p-4"
          >
            <h5 class="mb-3 text-sm font-bold text-gray-900">Schimba statusul</h5>
            <div class="flex gap-3">
              <USelect v-model="newStatus" :items="statusChoices" class="flex-1" />
              <UButton
                color="primary"
                :loading="isSavingStatus"
                :disabled="newStatus === selectedOrder.status"
                @click="saveStatus"
                >Salveaza</UButton
              >
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
              >Descarca proforma</UButton
            >
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
