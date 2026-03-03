<script setup lang="ts">
const props = defineProps<{
  product: any
  to: string
}>()

const { addToCart, isLoading } = useCart()
const { favorites, addToFavorites, removeFromFavorites } = useFavorites()

const isFavorite = computed(() => favorites.value.some((f: any) => f.productId === props.product.id))

const toggleFavorite = async () => {
    if (isFavorite.value) {
        const fav = favorites.value.find((f: any) => f.productId === props.product.id)
        if (fav) await removeFromFavorites(fav.id)
    } else {
        await addToFavorites(props.product)
    }
}
</script>

<template>
  <NuxtLink :to="to" class="group h-full">
    <UCard class="h-full hover:ring-2 hover:ring-primary transition-all duration-200 flex flex-col rounded-sm" :ui="{ footer: 'p-2' }">
      <div class="aspect-square bg-white flex items-center justify-center relative overlow-hidden">
        <NuxtImg 
          :src="product.image || ''" 
          :alt="product.name"
          class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200" 
        />
      </div>
      <template #footer>
        <div class="w-full flex flex-col gap-4">
          <div class="space-y-2">
              <p class="font-medium text-sm line-clamp-3 min-h-[60px]">{{ product.name }}</p>
          </div>
          <div class="leading-none">
            <p class="text-xs">Cod: {{ product.sku || 123456789 }}</p>
            <p class="text-xs">Disponibilitate: <UBadge color="success" variant="soft" class="rounded-sm">In stoc</UBadge></p>
          </div>
          <div class="flex flex-col gap-2">
            <div class="leading-none">
              <p class="font-bold text-primary">{{ product.price }} RON</p>
              <span class="text-xs text-gray-500">Pretul include TVA</span>
            </div>
            <div class="flex gap-2">
              <UButton 
                size="sm" 
                color="primary" 
                variant="solid" 
                class="rounded-sm flex-1" 
                @click.prevent="addToCart(product)"
                :loading="isLoading"
              >
                Adauga in cos
              </UButton>
              <UButton 
                size="sm" 
                :color="isFavorite ? 'primary' : 'neutral'" 
                :variant="isFavorite ? 'solid' : 'subtle'" 
                icon="i-lucide-heart"
                class="rounded-sm"
                @click.prevent="toggleFavorite"
              />
            </div>
          </div>
        </div>
      </template>
    </UCard>
  </NuxtLink>
</template>
