<script setup lang="ts">
// alt names the link's target: each banner is the only content of its link.
const items = [
  { image: 'https://cdn.timbirotica.ro/uploads/banners/bg_banner_faber.webp', link: '/producatori/faber-castell', alt: 'Produse Faber-Castell' },
  { image: 'https://cdn.timbirotica.ro/uploads/banners/bg_banner_fellowes.webp', link: '/producatori/fellowes', alt: 'Produse Fellowes' },
  { image: 'https://cdn.timbirotica.ro/uploads/banners/bg_banner_leuchtturm.webp', link: '/producatori/leuchtturm', alt: 'Produse Leuchtturm' },
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
      <NuxtImg :src="item.image" :alt="item.alt" class="rounded-sm w-full h-full object-cover aspect-[50/33]" />
    </NuxtLink>
  </UCarousel>
</template>
