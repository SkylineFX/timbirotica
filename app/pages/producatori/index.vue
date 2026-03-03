<script setup lang="ts">

const { data: brands } = await useFetch('/api/brands')
</script>

<template>
  <UContainer class="py-6">
    <h1 class="text-xl font-bold mb-8">Lista producatorilor</h1>
    
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <NuxtLink 
        v-for="brand in brands" 
        :key="brand.to" 
        :to="brand.to"
        class="group"
      >
        <UCard class="h-full hover:ring-2 hover:ring-primary transition-all duration-200">
          <div class="aspect-[16/9] bg-white flex items-center justify-center">
            <NuxtImg 
              :src="brand.image || ''" 
              :alt="brand.label"
              class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-200" 
            />
          </div>
          <template #footer>
            <p class="text-center font-medium truncate">{{ brand.label }}</p>
          </template>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
