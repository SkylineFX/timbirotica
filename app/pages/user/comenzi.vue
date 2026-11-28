<script setup lang="ts">
import { ref } from 'vue'
import { shippingMethodLabel, paymentMethodLabel } from '~~/shared/constants/order'
import { formatShopDateTime, formatShopLongDate } from '~~/shared/utils/format'
import { fetchFailure } from '~~/shared/utils/fetchFailure'
import type { BillingAddressSnapshot, ShippingAddressSnapshot } from '~~/shared/types/account'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

const { data: userOrders, refresh: refreshOrders } = await useFetch('/api/user/orders')
// One order of GET /api/user/orders, with its lines.
type UserOrder = NonNullable<typeof userOrders.value>[number]
const { fetchCart, cartItems } = useCart()
const toast = useToast()

const statusLabel = ORDER_STATUS_LABEL
const statusColor = ORDER_STATUS_COLOR

const isOrderModalOpen = ref(false)
const selectedOrder = ref<UserOrder | null>(null)
const parsedShippingAddress = ref<ShippingAddressSnapshot>({})
const parsedBillingAddress = ref<BillingAddressSnapshot>({})
const isCancelLoading = ref(false)
const isReorderLoading = ref(false)
const isReorderConfirmOpen = ref(false)

function openOrderDetails(order: UserOrder) {
  selectedOrder.value = order

  try {
    parsedShippingAddress.value = JSON.parse(order.shippingAddressSnapshot || '{}')
  } catch {
    parsedShippingAddress.value = {}
  }

  try {
    parsedBillingAddress.value = JSON.parse(order.billingAddressSnapshot || '{}')
  } catch {
    parsedBillingAddress.value = {}
  }

  isOrderModalOpen.value = true
}

async function cancelOrder() {
  if (!selectedOrder.value) return
  isCancelLoading.value = true
  try {
    await $fetch(`/api/user/orders/${selectedOrder.value.id}`, { method: 'PATCH' })
    await refreshOrders()
    selectedOrder.value = { ...selectedOrder.value, status: 'cancelled' }
    toast.add({ title: 'Comanda a fost anulata', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Eroare la anularea comenzii',
      description: fetchFailure(err).message,
      color: 'error'
    })
    // The order may have been confirmed in the meantime: show its current status.
    await refreshOrders()
    const current = userOrders.value?.find((o) => o.id === selectedOrder.value?.id)
    if (current) selectedOrder.value = { ...selectedOrder.value, status: current.status }
  } finally {
    isCancelLoading.value = false
  }
}

function orderAgain() {
  if (!selectedOrder.value?.items?.length) return
  if (cartItems.value.length > 0) {
    isReorderConfirmOpen.value = true
    return
  }
  performReorder({ replace: false })
}

async function performReorder({ replace }: { replace: boolean }) {
  if (!selectedOrder.value?.items?.length) return
  isReorderLoading.value = true
  try {
    // One request for the whole order (server/api/user/orders/[id]/reorder.post.ts).
    // The server reads the order's lines, skips unavailable products and changes
    // the cart in one transaction, so a large order never half-fills the cart.
    // It adds to or replaces the cart it holds, so send quantity changes still
    // waiting first: sent after, they would overwrite the sums or hit deleted lines.
    await flushCartQuantityUpdates()
    const { added, skipped } = await $fetch(`/api/user/orders/${selectedOrder.value.id}/reorder`, {
      method: 'POST',
      body: { replace }
    })
    await fetchCart()

    if (added === 0) {
      toast.add({
        title: 'Produsele nu sunt disponibile',
        description: skipped.join(', '),
        color: 'error'
      })
    } else if (skipped.length) {
      toast.add({
        title: 'Unele produse nu sunt disponibile',
        description: `Sarite: ${skipped.join(', ')}`,
        color: 'warning'
      })
    } else {
      toast.add({
        title: replace ? 'Cosul a fost inlocuit' : 'Produsele au fost adaugate in cos',
        color: 'success'
      })
    }
  } catch {
    toast.add({ title: 'Eroare la adaugarea in cos', color: 'error' })
  } finally {
    isReorderLoading.value = false
    isReorderConfirmOpen.value = false
  }
}
</script>

<template>
  <div>
    <div class="overflow-hidden">
      <!-- Order History Section -->
      <div
        v-if="!userOrders || userOrders.length === 0"
        class="rounded-md border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500"
      >
        Nu aveti nicio comanda plasata momentan.
      </div>

      <div v-else class="grid grid-cols-1 gap-5">
        <div
          v-for="order in userOrders"
          :key="order.id"
          class="flex flex-col justify-between rounded-sm border border-gray-200 bg-white p-5 transition-all hover:border-gray-300"
        >
          <div>
            <div class="flex items-center justify-between border-b border-gray-100 pb-2">
              <div class="flex flex-col">
                <p class="tracking-wider text-gray-900">
                  Nr. comanda:
                  <span class="text-md font-bold text-gray-900">#{{ order.orderNumber }}</span>
                </p>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">{{
                    formatShopLongDate(order.createdAt)
                  }}</span>
                  <span class="text-sm text-gray-500">·</span>
                  <span class="text-sm text-gray-500">Total: {{ order.total.toFixed(2) }} RON</span>
                </div>
              </div>
              <UBadge
                :color="statusColor[order.status]"
                variant="subtle"
                size="sm"
                class="hidden lg:block"
                >{{ statusLabel[order.status] }}</UBadge
              >
              <!-- <span class="relative flex h-3 w-3 flex-shrink-0 lg:hidden">
                    <span v-if="order.status === 'processing'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3" :class="{ 'bg-yellow-200': order.status === 'processing' }"></span>
                 </span> -->
            </div>
          </div>

          <!-- Product image strip -->
          <div class="my-4 flex gap-2 overflow-hidden border-b border-gray-100 pb-4">
            <NuxtLink
              v-for="item in order.items"
              :key="item.id"
              :to="`/c/${item.product?.category?.slug ?? 'toate'}/${item.product?.slug}`"
              class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border border-gray-200 bg-white transition-colors hover:border-primary"
            >
              <NuxtImg
                v-if="item.product?.images?.[0]"
                :src="item.product.images[0]"
                :alt="item.product?.name"
                loading="lazy"
                class="h-full w-full object-contain p-1"
              />
              <div v-else class="flex h-full w-full items-center justify-center bg-gray-50">
                <UIcon name="i-lucide-image" class="h-5 w-5 text-gray-300" />
              </div>
            </NuxtLink>
          </div>

          <div class="mt-2 flex items-center justify-between">
            <span class="flex flex-col text-sm text-gray-500">
              <span class="capitalize"
                >Produse:
                <span class="font-medium text-gray-700"
                  >{{ (order.total - order.shippingCost).toFixed(2) }} RON</span
                ></span
              >
              <span
                >Livrare:
                <span class="font-medium text-gray-700"
                  >{{ (order.shippingCost ?? 0).toFixed(2) }} RON</span
                ></span
              >
            </span>
            <div class="flex flex-col items-end gap-2">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                class="w-full justify-center"
                @click="openOrderDetails(order)"
                >Detalii comanda</UButton
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <UModal
      v-model:open="isOrderModalOpen"
      title="Detalii Comanda"
      :ui="{ content: 'rounded-md shadow-none sm:max-w-3xl' }"
    >
      <template #body>
        <div v-if="selectedOrder" class="space-y-6 px-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h4 class="text-xl font-bold tracking-tight text-gray-900">
                #{{ selectedOrder.orderNumber }}
              </h4>
              <p class="mt-0.5 text-sm text-gray-500">
                Plasata pe {{ formatShopDateTime(selectedOrder.createdAt) }}
              </p>
            </div>
            <div class="text-right">
              <UBadge
                :color="statusColor[selectedOrder.status] ?? 'neutral'"
                variant="subtle"
                size="sm"
                >{{ statusLabel[selectedOrder.status] ?? selectedOrder.status }}</UBadge
              >
            </div>
          </div>

          <!-- Context Info grids -->
          <div class="mb-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Livrare Box -->
            <div class="bg-gray-50/00 rounded-sm border border-gray-200 p-4">
              <div class="flex justify-between">
                <h5 class="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <UIcon name="i-lucide-truck" class="h-4 w-4" /> Livrare
                </h5>
                <UBadge color="primary" variant="subtle" size="sm" class="capitalize">{{
                  shippingMethodLabel(selectedOrder.shippingMethod)
                }}</UBadge>
              </div>

              <div class="mt-2">
                <template v-if="selectedOrder.shippingMethod === 'courier'">
                  <p class="text-sm font-medium text-gray-900">
                    {{ parsedShippingAddress.firstName }} {{ parsedShippingAddress.lastName }} ·
                    {{ parsedShippingAddress.phone }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-sm text-gray-600">
                    {{ parsedShippingAddress.street }}, {{ parsedShippingAddress.city }},
                    {{ parsedShippingAddress.county }}
                  </p>
                </template>
                <template v-else>
                  <p class="text-sm text-gray-600">
                    Comanda poate fi ridicata de la
                    <a href="/despre-noi#locatie" class="font-medium text-primary">sediul nostru</a
                    >. Vei primi un email cand aceasta va fi gata de ridicare.
                  </p>
                </template>
              </div>
            </div>

            <!-- Facturare Box -->
            <div class="bg-gray-50/00 rounded-sm border border-gray-200 p-4">
              <div class="flex justify-between">
                <h5 class="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <UIcon name="i-lucide-receipt-text" class="h-4 w-4" /> Plata & Facturare
                </h5>
                <UBadge color="primary" variant="subtle" size="sm" class="capitalize">{{
                  paymentMethodLabel(selectedOrder.paymentMethod)
                }}</UBadge>
              </div>

              <div class="mt-2">
                <template v-if="parsedBillingAddress.companyName">
                  <p class="text-sm font-medium text-gray-900">
                    {{ parsedBillingAddress.companyName }} ·
                    {{ parsedBillingAddress.hasRo ? 'RO ' : '' }}{{ parsedBillingAddress.cui }}
                  </p>
                  <p v-if="parsedBillingAddress.onrc" class="mt-1 text-sm text-gray-600">
                    {{ parsedBillingAddress.onrc }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-sm text-gray-600">
                    {{ parsedBillingAddress.street }}, {{ parsedBillingAddress.city }},
                    {{ parsedBillingAddress.county }}
                  </p>
                  <!-- <p v-if="parsedBillingAddress.phone" class="text-sm text-gray-600 mt-1">Telefon: {{ parsedBillingAddress.phone }}</p> -->
                </template>
                <template v-else-if="parsedBillingAddress.firstName">
                  <p class="text-sm font-medium text-gray-900">
                    {{ parsedBillingAddress.firstName }} {{ parsedBillingAddress.lastName }} ·
                    {{ parsedBillingAddress.phone }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-sm text-gray-600">
                    {{ parsedBillingAddress.street }}, {{ parsedBillingAddress.city }},
                    {{ parsedBillingAddress.county }}
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

          <div class="mt-6 space-y-4">
            <h5 class="font-semibold text-gray-900">Produse comandate</h5>
            <div class="flex flex-col gap-3">
              <div
                v-for="item in selectedOrder.items"
                :key="item.id"
                class="flex gap-4 border-b border-gray-100 py-3 last:border-0"
              >
                <div
                  class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white"
                >
                  <img
                    v-if="item.product && item.product.images?.[0]"
                    :src="item.product.images[0]"
                    :alt="item.product.name"
                    loading="lazy"
                    class="h-full w-full object-contain p-1"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center bg-gray-100/50">
                    <UIcon name="i-lucide-image" class="h-6 w-6 text-gray-300" />
                  </div>
                </div>
                <div class="flex min-w-0 flex-1 flex-col justify-between">
                  <NuxtLink
                    :to="`/c/${item.product?.category?.slug ?? 'toate'}/${item.product?.slug}`"
                    class="line-clamp-1 font-medium text-gray-900 transition-colors hover:text-primary"
                  >
                    {{ item.product?.name || 'Produs indisponibil' }}
                  </NuxtLink>
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm text-gray-500">Cantitate: {{ item.quantity }}</p>
                    <p class="font-bold text-gray-900">
                      {{ (item.priceAtBuy * item.quantity).toFixed(2) }} RON
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-dashed border-gray-200 pt-6">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-gray-600">Subtotal</p>
              <p class="font-medium text-gray-900">
                {{ (selectedOrder.total - selectedOrder.shippingCost).toFixed(2) }} RON
              </p>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <p class="text-gray-600">Livrare</p>
              <p class="font-medium text-gray-900">
                {{ selectedOrder.shippingCost.toFixed(2) }} RON
              </p>
            </div>
            <div class="flex items-center justify-between">
              <p class="font-bold text-gray-900">Total</p>
              <p class="text-xl font-bold text-gray-900">
                {{ selectedOrder.total.toFixed(2) }} RON
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-2 md:flex-row">
              <UButton
                icon="i-lucide-download"
                color="neutral"
                size="xl"
                variant="soft"
                class="flex-1 justify-center rounded-sm text-sm"
                :to="`/api/user/orders/${selectedOrder.id}/proforma`"
                external
                download
                >Descarca proforma</UButton
              >
              <UButton
                color="neutral"
                size="xl"
                variant="outline"
                class="flex-1 justify-center rounded-sm text-sm"
                :loading="isReorderLoading"
                @click="orderAgain"
                >Comanda din nou</UButton
              >
            </div>
            <UButton
              v-if="selectedOrder.status === 'processing'"
              color="error"
              size="xl"
              variant="outline"
              class="flex-1 justify-center rounded-sm text-sm"
              :loading="isCancelLoading"
              @click="cancelOrder"
              >Anuleaza comanda</UButton
            >
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isReorderConfirmOpen"
      title="Cosul nu este gol"
      :ui="{ content: 'rounded-md sm:max-w-md' }"
    >
      <template #body>
        <p class="text-sm text-gray-600">
          Cosul tau contine deja produse. Cum vrei sa adaugi produsele din aceasta comanda?
        </p>
      </template>
      <template #footer>
        <div class="flex w-full flex-col gap-2 sm:flex-row">
          <UButton
            color="error"
            variant="soft"
            class="flex-1 justify-center rounded-sm"
            :loading="isReorderLoading"
            @click="performReorder({ replace: true })"
          >
            Inlocuieste cosul
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            class="flex-1 justify-center rounded-sm"
            :loading="isReorderLoading"
            @click="performReorder({ replace: false })"
          >
            Adauga la cos
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
