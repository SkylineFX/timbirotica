<script setup lang="ts">
import { useCart, type CartLine } from '~/composables/useCart'
import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'

const { item, variant = 'slideover' } = defineProps<{
  item: CartLine
  variant?: string
}>()

// cartLocked: an order is being placed, so the cart can't change.
const { removeFromCart, updateQuantity, cartLocked } = useCart()
</script>

<template>
  <div
    class="flex w-full gap-4"
    :class="variant === 'slideover' ? 'border-b border-gray-200 py-8 dark:border-gray-800' : 'py-3'"
  >
    <NuxtLink
      :to="`/c/${item.product?.category?.slug}/${item.product?.slug}`"
      class="flex flex-shrink-0 cursor-pointer items-center justify-center rounded-sm border border-gray-200 p-1"
    >
      <NuxtImg
        :src="item.product?.images?.[0] || 'https://placehold.co/100'"
        :alt="item.product?.name"
        loading="lazy"
        class="h-16 w-16 shrink-0 rounded-sm bg-white object-contain"
        :class="variant === 'checkout' ? 'p-1' : ''"
      />
    </NuxtLink>
    <div class="flex min-w-0 flex-1 flex-col justify-between">
      <NuxtLink :to="`/c/${item.product?.category?.slug}/${item.product?.slug}`">
        <p
          class="text-sm font-semibold"
          :class="variant === 'checkout' ? 'truncate' : 'line-clamp-2'"
        >
          {{ item.product?.name }}
        </p>
      </NuxtLink>
      <div class="mt-2 flex items-end justify-between">
        <div class="flex items-center gap-1">
          <UButton
            size="xs"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            aria-label="Sterge din cos"
            :disabled="cartLocked"
            class="p-1.5"
            @click="removeFromCart(item.id)"
          />
          <!-- Stops at 1: holding the minus button, an arrow key or the wheel
                      shouldn't delete a line. Removal is the trash button only. -->
          <UInputNumber
            size="xs"
            class="w-24"
            :model-value="item.quantity"
            :min="1"
            :max="CART_MAX_QUANTITY"
            :step="1"
            disable-wheel-change
            :disabled="cartLocked"
            @update:model-value="(val) => updateQuantity(item.id, Number(val))"
          />
        </div>
        <div class="flex flex-col items-end">
          <span class="text-sm font-medium"
            >{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }} RON</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
