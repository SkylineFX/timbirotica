<script setup lang="ts">
const { data: categories } = await useFetch('/api/categories/tree')
</script>

<template>
  <UContainer class="py-8 lg:py-12">
    <h1 class="text-3xl lg:text-4xl font-bold mb-8">Toate Categoriile</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard 
        v-for="category in categories" 
        :key="category.id" 
        class="h-full overflow-hidden rounded-sm flex flex-col"
        :ui="{ body: 'flex-1 flex flex-col !p-0' }"
      >
        <div class="flex flex-1 min-h-[9rem] sm:min-h-[10rem]">
          <!-- Left: Image -->
          <NuxtLink
            :to="category.to"
            class="w-2/5 flex items-center justify-center border-r border-gray-200 hover:opacity-90 transition-opacity"
          >
            <div class="w-full h-full bg-gray-50/0 flex items-center justify-center">
                <NuxtImg
                  v-if="category.image"
                  :src="category.image"
                  :alt="category.label"
                  class="w-full h-full object-contain p-4"
                />
                <UIcon v-else name="i-heroicons-photo" class="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
          </NuxtLink>
          
          <!-- Right: Content -->
          <div class="w-3/5 p-4 flex flex-col">
            <NuxtLink :to="category.to" class="group">
              <h2 class="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {{ category.label }}
              </h2>
            </NuxtLink>
            
            <!-- Subcategories (up to 3) -->
            <ul v-if="category.children && category.children.length > 0" class="space-y-1">
              <li v-for="sub in category.children.slice(0, 3)" :key="sub.id">
                <NuxtLink 
                  :to="sub.to" 
                  class="text-sm text-gray-500 hover:text-primary truncate block"
                >
                  {{ sub.label }}
                </NuxtLink>
              </li>
              <li v-if="category.children.length > 3" class="text-xs mt-1">
                <NuxtLink :to="category.to" class="text-gray-400 hover:text-primary transition-colors">
                  + {{ category.children.length - 3 }} subcategorii
                </NuxtLink>
              </li>
            </ul>
            <div v-else class="mt-auto">
              <NuxtLink :to="category.to" class="text-sm text-primary hover:text-primary font-medium">
                Vezi produse &rarr;
              </NuxtLink>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
