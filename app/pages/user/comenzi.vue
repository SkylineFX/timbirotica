<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

const { data: userOrders, refresh: refreshOrders } = await useFetch('/api/user/orders')
const { fetchCart, cartItems, clearServerCart } = useCart()
const toast = useToast()

const statusLabel = ORDER_STATUS_LABEL
const statusColor = ORDER_STATUS_COLOR

const isOrderModalOpen = ref(false)
const selectedOrder = ref<any>(null)
const parsedShippingAddress = ref<any>({})
const parsedBillingAddress = ref<any>({})
const isCancelLoading = ref(false)
const isReorderLoading = ref(false)
const isReorderConfirmOpen = ref(false)

function openOrderDetails(order: any) {
  selectedOrder.value = order

  try {
    parsedShippingAddress.value = JSON.parse(order.shippingAddressSnapshot || '{}')
  } catch(e) {
    parsedShippingAddress.value = {}
  }

  try {
    parsedBillingAddress.value = JSON.parse(order.billingAddressSnapshot || '{}')
  } catch(e) {
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
  } catch (err: any) {
    toast.add({ title: 'Eroare la anularea comenzii', description: err.data?.message, color: 'error' })
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
    if (replace) {
      try {
        await clearServerCart()
      } catch {
        toast.add({ title: 'Nu am putut goli cosul', color: 'error' })
        return
      }
    }

    const items = selectedOrder.value.items
    const results = await Promise.allSettled(
      items.map((item: any) =>
        $fetch('/api/cart', { method: 'POST', body: { productId: item.productId, quantity: item.quantity } })
      )
    )
    await fetchCart()

    const skipped = results
      .map((r, i) => ({ r, name: items[i].product?.name }))
      .filter(({ r }) => r.status === 'rejected')
      .map(({ name }) => name)
      .filter(Boolean)

    if (skipped.length === items.length) {
      toast.add({ title: 'Produsele nu sunt disponibile', description: skipped.join(', '), color: 'error' })
    } else if (skipped.length) {
      toast.add({ title: 'Unele produse nu sunt disponibile', description: `Sarite: ${skipped.join(', ')}`, color: 'warning' })
    } else {
      toast.add({ title: replace ? 'Cosul a fost inlocuit' : 'Produsele au fost adaugate in cos', color: 'success' })
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
         <div v-if="!userOrders || userOrders.length === 0" class="text-center py-12 rounded-md text-gray-500 bg-gray-50 border border-dashed border-gray-200">
            Nu aveti nicio comanda plasata momentan.
         </div>

         <div v-else class="grid grid-cols-1 gap-5">
            <div v-for="order in userOrders" :key="order.id" class="p-5 rounded-sm border border-gray-200 bg-white hover:border-gray-300 transition-all flex flex-col justify-between">
              
              <div>
                <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                 <div class="flex flex-col">
                    <p class="text-gray-900 tracking-wider">Nr. comanda: 
                      <span class="font-bold text-md text-gray-900">#{{ order.orderNumber }}</span>
                    </p>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-500">{{ new Date(order.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                      <span class="text-sm text-gray-500">·</span>
                      <span class="text-sm text-gray-500">Total: {{ order.total.toFixed(2) }} RON</span>
                    </div>
                 </div>
                 <UBadge :color="statusColor[order.status]" variant="subtle" size="sm" class="hidden lg:block">{{ statusLabel[order.status] }}</UBadge>
                 <span class="relative flex h-3 w-3 flex-shrink-0 lg:hidden">
                    <span v-if="order.status === 'processing'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3" :class="{ 'bg-yellow-200': order.status === 'processing' }"></span>
                 </span>
                </div>
              </div>

              <!-- Product image strip -->
              <div class="flex gap-2 overflow-hidden my-4 pb-4 border-b border-gray-100">
                <NuxtLink
                  v-for="item in order.items"
                  :key="item.id"
                  :to="`/c/${item.product?.category?.slug ?? 'toate'}/${item.product?.slug}`"
                  class="flex-shrink-0 w-14 h-14 rounded-sm border border-gray-200 bg-white overflow-hidden hover:border-primary transition-colors"
                >
                  <NuxtImg
                    v-if="item.product?.images?.[0]"
                    :src="item.product.images[0]"
                    :alt="item.product?.name"
                    class="w-full h-full object-contain p-1"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gray-50">
                    <UIcon name="i-lucide-image" class="w-5 h-5 text-gray-300" />
                  </div>
                </NuxtLink>
              </div>

              <div class="mt-2 flex justify-between items-center">
                <span class="text-sm text-gray-500 flex flex-col">
                  <span class="capitalize">Produse: <span class="font-medium text-gray-700">{{ (order.total - order.shippingCost).toFixed(2) }} RON</span></span>
                  <span>Livrare: <span class="font-medium text-gray-700">{{ (order.shippingCost ?? 0).toFixed(2) }} RON</span></span>
                </span>
                <div class="flex flex-col items-end gap-2">
                  <UButton color="neutral" variant="outline" size="sm" class="justify-center w-full" @click="openOrderDetails(order)">Detalii comanda</UButton>
                </div>
              </div>
              
            </div>
         </div>
    </div>

    <!-- Order Details Modal -->
    <UModal v-model:open="isOrderModalOpen" title="Detalii Comanda" :ui="{ content: 'rounded-md shadow-none sm:max-w-3xl' }">
      <template #body>
         <div v-if="selectedOrder" class="px-2 space-y-6">
            <div class="flex justify-between items-center border-b border-gray-100 pb-4">
               <div>
                  <h4 class="font-bold text-gray-900 text-xl tracking-tight">#{{ selectedOrder.orderNumber }}</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Plasata pe {{ new Date(selectedOrder.createdAt).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }) }}</p>
               </div>
               <div class="text-right">
                  <UBadge :color="statusColor[selectedOrder.status] ?? 'neutral'" variant="subtle" size="sm">{{ statusLabel[selectedOrder.status] ?? selectedOrder.status }}</UBadge>
               </div>
            </div>

            <!-- Context Info grids -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
               <!-- Livrare Box -->
               <div class="bg-gray-50/70 p-4 rounded-sm border border-gray-100">
                  <div class="flex justify-between mb-2">
                     <h5 class="text-sm font-bold text-gray-900 flex items-center gap-1.5"><UIcon name="i-lucide-truck" class="w-4 h-4"/> Livrare</h5>
                     <UBadge color="primary" variant="subtle" size="sm" class="capitalize">{{ selectedOrder.shippingMethod === 'courier' ? 'Curier' : 'Ridicare personala' }}</UBadge>
                  </div>
                  
                  <template v-if="selectedOrder.shippingMethod === 'courier'">
                     <p class="font-medium text-sm text-gray-900">{{ parsedShippingAddress.firstName }} {{ parsedShippingAddress.lastName }} · {{ parsedShippingAddress.phone.replace('+40', '0') }}</p>
                     <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ parsedShippingAddress.street }}, {{ parsedShippingAddress.city }}, {{ parsedShippingAddress.county }}</p>
                  </template>
                  <template v-else>
                     <p class="text-sm text-gray-600">Comanda poate fi ridicata de la <a href="/despre-noi#locatie" class="text-primary font-medium">sediul nostru</a>. Vei primi un email cand aceasta va fi gata de ridicare.</p>
                  </template>
               </div>

               <!-- Facturare Box -->
               <div class="bg-gray-50/70 p-4 rounded-sm border border-gray-100">
                  <div class="flex justify-between mb-2">
                     <h5 class="text-sm font-bold text-gray-900 flex items-center gap-1.5"><UIcon name="i-lucide-receipt-text" class="w-4 h-4"/> Facturare</h5>
                     <UBadge color="primary" variant="subtle" size="sm" class="capitalize">{{ selectedOrder.paymentMethod === 'cash' ? 'Ramburs' : 'Transfer Bancar' }}</UBadge>
                  </div>

                  <template v-if="parsedBillingAddress.companyName">
                     <p class="font-medium text-sm text-gray-900">{{ parsedBillingAddress.companyName }} · {{ parsedBillingAddress.onrc }}</p>
                     <!-- <p class="text-sm text-gray-600 mt-1">{{ parsedBillingAddress.hasRo ? 'RO ' : '' }}{{ parsedBillingAddress.cui }}</p> -->
                     <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ parsedBillingAddress.street }}, {{ parsedBillingAddress.city }}, {{ parsedBillingAddress.county }}</p>
                  </template>
                  <template v-else-if="parsedShippingAddress.firstName">
                     <p class="font-medium text-sm text-gray-900">{{ parsedShippingAddress.firstName }} {{ parsedShippingAddress.lastName }} · {{ parsedShippingAddress.phone.replace('+40', '0') }}</p>
                     <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ parsedShippingAddress.street }}, {{ parsedShippingAddress.city }}, {{ parsedShippingAddress.county }}</p>
                  </template>
               </div>
            </div>

            <div class="space-y-4 mt-6">
               <h5 class="font-semibold text-gray-900">Produse comandate</h5>
               <div class="flex flex-col gap-3">
                  <div v-for="item in selectedOrder.items" :key="item.id" class="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                     <div class="w-16 h-16 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                        <img v-if="item.product && item.product.images?.[0]" :src="item.product.images[0]" :alt="item.product.name" class="w-full h-full object-contain p-1" />
                        <div v-else class="w-full h-full flex items-center justify-center bg-gray-100/50">
                           <UIcon name="i-lucide-image" class="w-6 h-6 text-gray-300" />
                        </div>
                     </div>
                     <div class="flex flex-1 min-w-0 flex-col justify-between">
                        <NuxtLink :to="`/c/${item.product?.category?.slug ?? 'toate'}/${item.product?.slug}`" class="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-1">
                           {{ item.product?.name || 'Produs indisponibil' }}
                        </NuxtLink>
                        <div class="flex justify-between items-center gap-2">
                           <p class="text-sm text-gray-500">Cantitate: {{ item.quantity }}</p>
                           <p class="font-bold text-gray-900">{{ (item.priceAtBuy * item.quantity).toFixed(2) }} RON</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div class="border-t border-gray-200 border-dashed pt-6">
               <div class="flex justify-between items-center mb-2">
                  <p class="text-gray-600">Subtotal</p>
                  <p class="font-medium text-gray-900">{{ (selectedOrder.total - selectedOrder.shippingCost).toFixed(2) }} RON</p>
               </div>
               <div class="flex justify-between items-center mb-2">
                  <p class="text-gray-600">Livrare</p>
                  <p class="font-medium text-gray-900">{{ selectedOrder.shippingCost.toFixed(2) }} RON</p>
               </div>
               <div class="flex justify-between items-center">
                  <p class="font-bold text-gray-900">Total</p>
                  <p class="font-bold text-gray-900 text-xl">{{ selectedOrder.total.toFixed(2) }} RON</p>
               </div>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex flex-col gap-2 md:flex-row">
                <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    size="xl"
                    variant="soft"
                    class="flex-1 justify-center text-sm"
                    :to="`/api/user/orders/${selectedOrder.id}/proforma`"
                    external
                    download
                >Descarca proforma</UButton>
                <UButton
                    color="neutral"
                    size="xl"
                    variant="outline"
                    class="flex-1 justify-center text-sm"
                    :loading="isReorderLoading"
                    @click="orderAgain"
                >Comanda din nou</UButton>
              </div>
              <UButton
                v-if="selectedOrder.status === 'processing'"
                color="error"
                size="xl"
                variant="outline"
                class="flex-1 justify-center text-sm"
                :loading="isCancelLoading"
                @click="cancelOrder"
              >Anuleaza comanda</UButton>
            </div>
         </div>
      </template>
    </UModal>

    <UModal v-model:open="isReorderConfirmOpen" title="Cosul nu este gol" :ui="{ content: 'rounded-md sm:max-w-md' }">
      <template #body>
        <p class="text-sm text-gray-600">
          Cosul tau contine deja produse. Cum vrei sa adaugi produsele din aceasta comanda?
        </p>
      </template>
      <template #footer>
        <div class="flex flex-col sm:flex-row gap-2 w-full">
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
