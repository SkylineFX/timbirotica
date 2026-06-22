<script setup lang="ts">
const { data: brands } = useFetch('/api/brands')
</script>

<template>
  <div class="w-full bg-white py-2 rounded-sm border border-gray-200">
    <UMarquee pause-on-hover :overlay="false" :ui="{ root: '[--duration:180s]', content: 'gap-2' }">
      <NuxtLink 
        v-for="brand in brands" 
        :key="brand.to" 
        :to="brand.to"
        class="flex-shrink-0 flex items-center justify-center w-36 h-20 px-4 filter transition-all duration-300 ease-in-out"
      >
        <img v-if="brand.image" :src="brand.image" :alt="brand.label" class="max-h-full max-w-full object-contain" />
        <span v-else class="text-xl font-bold text-gray-400">{{ brand.label }}</span>
      </NuxtLink>
    </UMarquee>
  </div>
</template>
