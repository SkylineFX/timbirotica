<script setup lang="ts">
const { data: brands } = await useBrandList()
</script>

<template>
  <UContainer class="py-8 lg:py-12">
    <h1 class="mb-4 text-2xl font-bold md:mb-6 lg:text-3xl">Lista producatorilor</h1>

    <div class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <NuxtLink v-for="brand in brands" :key="brand.to" :to="brand.to" class="group">
        <UCard
          :ui="{ root: 'rounded-md' }"
          class="h-full transition-all duration-200 hover:ring-2 hover:ring-primary"
        >
          <div class="flex aspect-[16/9] items-center justify-center bg-white">
            <NuxtImg
              :src="brand.image || ''"
              :alt="brand.label"
              loading="lazy"
              class="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-110"
            />
          </div>
          <template #footer>
            <p class="truncate text-center font-medium">{{ brand.label }}</p>
          </template>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
