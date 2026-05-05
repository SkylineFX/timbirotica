<script setup lang="ts">
const items = [
  { image: '/uploads/banners/bg_banner_faber.webp', link: '/producatori/faber-castell' },
  { image: '/uploads/banners/bg_banner_fellowes.webp', link: '/producatori/fellowes' },
  { image: '/uploads/banners/bg_banner_leuchtturm.webp', link: '/producatori/leuchtturm' },
]
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    :autoplay="{delay: 10000}"
    loop
    dots
    arrows
    :items="items"
    :ui="{arrows: 'absolute top-1/2 left-0 right-0 sm:left-16 sm:right-16'}"
    class="w-full flex-1 bg-white rounded-md"
  >
    <NuxtLink :to="item.link" class="w-full h-full block">
      <NuxtImg :src="item.image" class="rounded-sm w-full h-full object-cover aspect-[50/33]" />
    </NuxtLink>
  </UCarousel>
</template>
