<script setup lang="ts">
const route = useRoute()
const categorySlug = route.params.slug as string

const { data: products } = await useFetch('/api/products', {
    query: { category: categorySlug }
})
</script>

<template>
  <UContainer class="py-12">
    <h1 class="text-3xl font-bold mb-8 capitalize">{{ categorySlug.replace(/-/g, ' ') }}</h1>

    <div v-if="products?.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <NuxtLink 
        v-for="product in products" 
        :key="product.id" 
        :to="`/categorii/${categorySlug}/${product.slug}`"
        class="group"
      >
        <UCard class="h-full hover:ring-2 hover:ring-primary transition-all duration-200 flex flex-col">
          <div class="aspect-square bg-white flex items-center justify-center p-4">
            <NuxtImg 
              :src="product.image || ''" 
              :alt="product.name"
              class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200" 
            />
          </div>
          <template #footer>
            <div class="space-y-2">
                <p class="font-medium text-sm line-clamp-2 min-h-[40px]">{{ product.name }}</p>
                <div class="font-bold text-primary">{{ product.price }} RON</div>
            </div>
          </template>
        </UCard>
      </NuxtLink>
    </div>
    <div v-else class="text-center py-12 text-gray-500">
        Nu au fost gasite produse in aceasta categorie.
    </div>
  </UContainer>
</template>
