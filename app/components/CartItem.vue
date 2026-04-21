<script setup lang="ts">
import { useCart } from '~/composables/useCart'

const { item, variant = 'slideover' } = defineProps<{
  item: any
  variant?: string
}>()

const { removeFromCart, updateQuantity } = useCart()
</script>

<template>
  <div class="flex gap-4 w-full" :class="variant === 'slideover' ? 'border-b border-gray-200 dark:border-gray-800 py-8' : 'py-3'">
    <NuxtLink :to="`/c/${item.product?.category?.slug}/${item.product?.slug}`">
      <NuxtImg :src="item.product?.images?.[0] || 'https://placehold.co/100'" class="w-16 h-16 object-contain bg-white rounded-md shrink-0" :class="variant === 'checkout' ? 'p-1' : ''" />
    </NuxtLink>
    <div class="flex-1 flex flex-col justify-between min-w-0">
        <NuxtLink :to="`/c/${item.product?.category?.slug}/${item.product?.slug}`">
          <p class="font-semibold text-sm" :class="variant === 'checkout' ? 'truncate' : 'line-clamp-2'">
             {{ item.product?.name }}
          </p>
        </NuxtLink>
      <div class="flex justify-between items-center mt-2">
             <div class="flex items-center gap-1">
                 <UButton size="xs" color="error" variant="soft" icon="i-lucide-trash-2" @click="removeFromCart(item.id)" />
                 <UInputNumber size="xs" class="w-24" :model-value="item.quantity" :min="0" :step="1" @update:model-value="(val) => updateQuantity(item.id, Number(val))" />
             </div>
             <div class="flex flex-col items-end">
                 <span class="font-medium text-sm">{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }} RON</span>
             </div>
      </div>
    </div>
  </div>
</template>
