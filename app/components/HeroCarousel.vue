<script setup lang="ts">
const items = [
  '/bannerImg/bg_banner_faber.webp',
  '/bannerImg/bg_banner_fellowes.webp',
  '/bannerImg/bg_banner_leuchtturm.webp',
]
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    fade
    dots
    arrows
    :items="items"
    :ui="{arrows: 'hidden md:block absolute top-1/2 left-16 right-16'}"
    class="w-full max-w-fit mx-auto bg-white rounded-md"
  >
    <NuxtImg :src="item" class="rounded-sm h-64 lg:h-120 w-full object-contain" />
  </UCarousel>
</template>

