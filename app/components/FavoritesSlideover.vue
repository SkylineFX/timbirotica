<script setup lang="ts">
const { favorites, isFavoritesOpen, removeFromFavorites, isLoading } = useFavorites()
const { addToCart } = useCart()

// Computed total price of favorites? (Not requested, but easy to add if needed. User asked for "with a delete button... and price, without quantity")
</script>

<template>
  <USlideover v-model:open="isFavoritesOpen" side="right" title="Lista Favorite" :ui="{ body: 'py-0 sm:py-0' }">
      <template #body>
          <div v-if="favorites.length === 0" class="p-8 text-center text-gray-500">
            Lista ta de favorite este goala.
          </div>
          <ul v-else class="flex flex-col">
            <li v-for="item in favorites" :key="item.id" class="flex gap-4 py-8 border-b border-gray-200 dark:border-gray-800">
               <NuxtLink :to="`/c/${item.product?.category?.slug}/${item.product?.slug}`" class="flex-shrink-0">
                  <NuxtImg :src="item.product?.images?.[0] || ''" class="w-16 h-16 object-contain bg-white rounded-md" />
               </NuxtLink>
              <div class="flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-medium text-sm line-clamp-2">
                        <NuxtLink :to="`/c/${item.product?.category?.slug}/${item.product?.slug}`">{{ item.product?.name }}</NuxtLink>
                    </h3>
                </div>
                <div class="flex justify-between items-center mt-2">
                       <div class="flex items-center gap-2">
                           <UButton size="xs" color="error" variant="soft" icon="i-lucide-trash-2" @click="removeFromFavorites(item.id)" />
                           <UButton size="xs" color="primary" variant="soft" icon="i-lucide-shopping-cart" @click="addToCart(item.product)" tooltip="Adauga in cos" />
                       </div>
                       <span class="font-bold text-sm">{{ (item.product?.price ?? 0).toFixed(2) }} RON</span>
                </div>
              </div>
            </li>
          </ul>
      </template>

       <template #footer>
        <div class="w-full flex justify-center">
             <UButton 
            color="neutral" 
            variant="subtle" 
            @click="isFavoritesOpen = false"
            icon="i-lucide-arrow-left"
            block
            class="rounded-sm p-3 justify-start"
          >
            Inchide
          </UButton>
        </div>
      </template>
  </USlideover>
</template>
