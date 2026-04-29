<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  middleware: ['authenticated']
})

const { data: userOrders, refresh: refreshOrders } = await useFetch('/api/user/orders')

const isOrderModalOpen = ref(false)
const selectedOrder = ref<any>(null)
const parsedShippingAddress = ref<any>({})
const parsedBillingAddress = ref<any>({})

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
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <h1 class="text-3xl lg:text-4xl font-bold mb-6">Comenzile mele</h1>
    <div class="overflow-hidden">
      <!-- Order History Section -->
         <div v-if="!userOrders || userOrders.length === 0" class="text-center py-12 rounded-md text-gray-500 bg-gray-50 border border-dashed border-gray-200">
            Nu aveți nicio comandă plasată momentan.
         </div>

         <div v-else class="grid grid-cols-1 gap-5">
            <div v-for="order in userOrders" :key="order.id" class="p-5 rounded-sm border border-gray-200 bg-white hover:border-gray-300 transition-all flex flex-col justify-between">
              
              <div>
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                 <div class="flex flex-col">
                    <p class="text-gray-900 tracking-wider">Nr. comandă: 
                      <span class="font-bold text-md text-gray-900">#{{ order.orderNumber }}</span>
                    </p>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-500">{{ new Date(order.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                      <span class="text-sm text-gray-500">·</span>
                      <span class="text-sm text-gray-500">Total: {{ order.total.toFixed(2) }} RON</span>
                    </div>
                 </div>
                 <!-- <UBadge :color="order.status === 'processing' ? 'warning' : 'success'" variant="subtle" size="sm" class="capitalize">{{ order.status }}</UBadge> -->
                </div>
              </div>

              <div class="mt-2 flex justify-between items-center">
                <span class="text-sm text-gray-500 flex flex-col">
                  <span>Livrare: <span class="font-medium text-gray-700">{{ (order.shippingCost ?? 0).toFixed(2) }} RON</span></span>
                  <span class="capitalize">Produse: <span class="font-medium text-gray-700">{{ (order.total - order.shippingCost).toFixed(2) }} RON</span></span>
                </span>
                <div class="flex flex-col items-end gap-2">
                  <UButton color="neutral" variant="outline" size="sm" class="justify-center w-full" @click="openOrderDetails(order)">Detalii comandă</UButton>
                </div>
              </div>
              
            </div>
         </div>
    </div>

    <!-- Order Details Modal -->
    <UModal v-model:open="isOrderModalOpen" title="Detalii Comandă" :ui="{ content: 'rounded-md shadow-none sm:max-w-3xl' }">
      <template #body>
         <div v-if="selectedOrder" class="px-2 space-y-6">
            <div class="flex justify-between items-center border-b border-gray-100 pb-4">
               <div>
                  <h4 class="font-bold text-gray-900 text-xl tracking-tight">#{{ selectedOrder.orderNumber }}</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Plasată pe {{ new Date(selectedOrder.createdAt).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }) }}</p>
               </div>
               <div class="text-right">
                  <UBadge :color="selectedOrder.status === 'processing' ? 'warning' : 'success'" variant="subtle" size="sm" class="capitalize">{{ selectedOrder.status }}</UBadge>
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
                     <p class="text-sm text-gray-600">Comanda poate fi ridicată de la <a href="/despre-noi#locatie" class="text-primary font-medium">sediul nostru</a>. Vei primi un email cand aceasta va fi gata de ridicare.</p>
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
                        <NuxtLink :to="`/c/toate/${item.product?.slug}`" class="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-1">
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
         </div>
      </template>
    </UModal>
  </UContainer>
</template>
