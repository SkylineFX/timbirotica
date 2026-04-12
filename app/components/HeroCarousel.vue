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
    class="w-full flex-1 bg-white rounded-md"
  >
    <NuxtImg :src="item" class="rounded-sm w-full h-full object-cover aspect-[50/33]" />
  </UCarousel>
</template>

