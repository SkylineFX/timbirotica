<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  middleware: ['authenticated']
})

const { data: userOrders, refresh: refreshOrders } = await useFetch('/api/user/orders')

// Order Details Modal State
const isOrderModalOpen = ref(false)
const selectedOrder = ref<any>(null)

function openOrderDetails(order: any) {
  selectedOrder.value = order
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

         <div v-else class="flex flex-col gap-4">
            <div v-for="order in userOrders" :key="order.id" class="p-5 border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-all flex justify-between gap-4">
               <div class="flex flex-col items-start justify-between">
                  <UBadge :color="order.status === 'completed' ? 'success' : order.status === 'processing' ? 'warning' : 'neutral'" size="xs" class="uppercase">
                     {{ order.status }}
                  </UBadge>
                  <div class="flex flex-col justify-center items-start">
                     <p class="font-bold text-gray-900 text-lg">{{ order.orderNumber }}</p>
                     <p class="text-sm text-gray-500">
                        Data: {{ new Date(order.createdAt).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }) }}
                     </p>
                  </div>
               </div>
               
               <div class="flex flex-col items-end justify-between gap-5">
                  <UButton color="neutral" variant="outline" size="sm" @click="openOrderDetails(order)">
                     Detalii comandă
                  </UButton>
                  <div class="text-right">
                    <p class="text-sm text-gray-500">Total Comandă</p>
                    <p class="font-bold text-gray-900 text-lg">{{ order.total.toFixed(2) }} Lei</p>
                  </div>
               </div>
            </div>
         </div>
    </div>

    <!-- Order Details Modal -->
    <UModal v-model:open="isOrderModalOpen" title="Detalii Comandă" :ui="{ content: 'sm:max-w-3xl' }">
      <template #body>
         <div v-if="selectedOrder" class="px-2 space-y-6">
            <div class="flex justify-between items-center border-b border-gray-100 pb-4">
               <div>
                  <h4 class="font-bold text-gray-900">Comanda {{ selectedOrder.orderNumber }}</h4>
                  <p class="text-sm text-gray-500">Plasată pe {{ new Date(selectedOrder.createdAt).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }) }}</p>
               </div>
               <div class="text-right">
                  <p class="text-sm text-gray-500">Total</p>
                  <p class="font-bold text-gray-900 text-lg">{{ selectedOrder.total.toFixed(2) }} Lei</p>
               </div>
            </div>

            <div class="space-y-4">
               <h5 class="font-semibold text-gray-900">Produse comandate</h5>
               <div class="flex flex-col gap-3">
                  <div v-for="item in selectedOrder.items" :key="item.id" class="flex gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                     <div class="w-16 h-16 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                        <img v-if="item.product && item.product.image" :src="item.product.image" :alt="item.product.name" class="w-full h-full object-contain p-1" />
                        <div v-else class="w-full h-full flex items-center justify-center bg-gray-100/50">
                           <UIcon name="i-lucide-image" class="w-6 h-6 text-gray-300" />
                        </div>
                     </div>
                     <div class="flex-1 min-w-0">
                        <NuxtLink :to="`/c/toate/${item.product?.slug}`" class="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-1">
                           {{ item.product?.name || 'Produs sters' }}
                        </NuxtLink>
                        <p class="text-sm text-gray-500 mt-1">Cantitate: {{ item.quantity }}</p>
                     </div>
                     <div class="text-right flex-shrink-0 flex items-center">
                        <p class="font-bold text-gray-900">{{ (item.priceAtBuy * item.quantity).toFixed(2) }} Lei</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </template>
    </UModal>
  </UContainer>
</template>
