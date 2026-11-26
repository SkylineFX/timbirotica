<script setup lang="ts">
const { data: brands } = useBrandList()
</script>

<template>
  <div class="w-full rounded-sm border border-gray-200 bg-white py-2">
    <UMarquee
      :repeat="2"
      pause-on-hover
      :overlay="false"
      :ui="{ root: '[--duration:180s]', content: 'gap-2' }"
    >
      <NuxtLink
        v-for="brand in brands"
        :key="brand.to"
        :to="brand.to"
        class="flex h-20 w-36 flex-shrink-0 items-center justify-center px-4 filter transition-all duration-300 ease-in-out"
      >
        <img
          v-if="brand.image"
          :src="brand.image"
          :alt="brand.label"
          loading="lazy"
          class="max-h-full max-w-full object-contain"
        />
        <span v-else class="text-xl font-bold text-gray-400">{{ brand.label }}</span>
      </NuxtLink>
    </UMarquee>
  </div>
</template>
