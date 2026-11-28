<script setup lang="ts">
import type { CartProduct } from '~/composables/useCart'

const props = defineProps<{
  product: CartProduct
  to: string
}>()

const { addToCart } = useCart()

// This card's own loading state: a click before its add resolves is ignored,
// and an add takes at least ADD_MIN_BUSY_MS (useCart), so a double click adds
// once, signed in or not. useCart's isLoading is shared by the whole page, so
// it would spin every card. Adds from different cards are sent one at a time
// by useCart.
const adding = ref(false)
const add = async () => {
  if (adding.value) return
  adding.value = true
  try {
    await addToCart(props.product)
  } finally {
    adding.value = false
  }
}
const { favorites, addToFavorites, removeFromFavorites } = useFavorites()

const isFavorite = computed(() => favorites.value.some((f) => f.productId === props.product.id))

const imageLoaded = ref(false)

const toggleFavorite = async () => {
  if (isFavorite.value) {
    const fav = favorites.value.find((f) => f.productId === props.product.id)
    if (fav) await removeFromFavorites(fav.id)
  } else {
    await addToFavorites(props.product)
  }
}
</script>

<template>
  <NuxtLink :to="to" class="group flex h-full flex-col">
    <UCard
      class="flex flex-1 flex-col rounded-sm bg-white transition-all duration-200 hover:ring-2 hover:ring-primary"
      :ui="{ body: 'p-2 sm:p-2', footer: 'p-2 sm:p-2 flex-1 flex flex-col' }"
    >
      <div class="relative aspect-square overflow-hidden bg-white">
        <USkeleton v-if="!imageLoaded" class="absolute inset-0 h-full w-full" />
        <NuxtImg
          :src="product.images?.[0] || ''"
          :alt="product.name"
          loading="lazy"
          class="absolute inset-0 h-full w-full object-contain p-4 transition-all duration-200 group-hover:scale-105"
          :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
          @load="imageLoaded = true"
          @error="imageLoaded = true"
        />

        <div class="absolute top-[0px] left-[0px]">
          <UButton
            size="sm"
            :color="isFavorite ? 'primary' : 'neutral'"
            :variant="isFavorite ? 'solid' : 'subtle'"
            icon="i-lucide-heart"
            :aria-label="isFavorite ? 'Sterge de la favorite' : 'Adauga la favorite'"
            class="rounded-sm"
            @click.prevent="toggleFavorite"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex h-full w-full flex-1 flex-col gap-4">
          <div class="space-y-2">
            <p class="truncate-3 min-h-[60px] text-sm font-medium">{{ product.name }}</p>
          </div>
          <div class="flex flex-col items-start gap-1 leading-none">
            <p class="text-xs">Cod: {{ product.sku || '-' }}</p>
            <UBadge
              v-if="product.stock > 0"
              color="success"
              variant="soft"
              class="rounded-sm"
              leading-icon="i-lucide-check"
              >Disponibil</UBadge
            >
            <UBadge v-else color="error" variant="soft" class="rounded-sm" leading-icon="i-lucide-x"
              >Indisponibil</UBadge
            >
          </div>
          <div class="flex flex-col gap-2">
            <div class="leading-none">
              <p class="font-bold text-primary">{{ product.price.toFixed(2) }} RON</p>
              <!-- <span class="text-xs text-gray-500">Pretul include TVA</span> -->
            </div>
            <div class="flex items-center justify-center text-center">
              <UButton
                size="sm"
                color="primary"
                variant="solid"
                class="flex-1 justify-center rounded-sm text-center text-xs lg:text-sm"
                :loading="adding"
                :disabled="product.stock === 0"
                @click.prevent="add"
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
