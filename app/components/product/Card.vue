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
  <NuxtLink :to="to" class="group h-full flex flex-col">
    <UCard class="flex-1 hover:ring-2 hover:ring-primary transition-all duration-200 flex flex-col rounded-sm bg-white" :ui="{ body: 'p-2 sm:p-2', footer: 'p-2 sm:p-2 flex-1 flex flex-col' }">
      <div class="aspect-square bg-white flex items-center justify-center relative overlow-hidden">
        <NuxtImg 
          :src="product.image || ''" 
          :alt="product.name"
          class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200" 
        />

        <div class="absolute top-[0px] left-[0px]">
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
      <template #footer>
        <div class="w-full flex flex-col gap-4 h-full flex-1">
          <div class="space-y-2">
              <p class="font-medium text-sm truncate-3 min-h-[60px]">{{ product.name }}</p>
          </div>
          <div class="leading-none flex flex-col gap-1 items-start">
            <p class="text-xs">Cod: {{ product.sku || 123456789 }}</p>
            <UBadge color="success" variant="soft" class="rounded-sm" leading-icon="i-lucide-check">In stoc</UBadge>
          </div>
          <div class="flex flex-col gap-2">
            <div class="leading-none">
              <p class="font-bold text-primary">{{ product.price }} RON</p>
              <!-- <span class="text-xs text-gray-500">Pretul include TVA</span> -->
            </div>
            <div class="flex justify-center items-center text-center">
              <UButton 
                size="sm" 
                color="primary" 
                variant="solid" 
                class="rounded-sm flex-1 justify-center text-center text-xs lg:text-sm" 
                @click.prevent="addToCart(product)"
                :loading="isLoading"
              >
                Adauga in cos
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UCard>
  </NuxtLink>
</template>
