<script setup lang="ts">
// alt names the link's target: each banner is the only content of its link.
const items = [
  {
    image: 'https://cdn.timbirotica.ro/uploads/banners/bg_banner_faber.webp',
    link: '/producatori/faber-castell',
    alt: 'Produse Faber-Castell'
  },
  {
    image: 'https://cdn.timbirotica.ro/uploads/banners/bg_banner_fellowes.webp',
    link: '/producatori/fellowes',
    alt: 'Produse Fellowes'
  },
  {
    image: 'https://cdn.timbirotica.ro/uploads/banners/bg_banner_leuchtturm.webp',
    link: '/producatori/leuchtturm',
    alt: 'Produse Leuchtturm'
  }
]
</script>

<template>
  <UCarousel
    v-slot="{ item, index }"
    :autoplay="{ delay: 10000 }"
    loop
    dots
    arrows
    :items="items"
    :ui="{ arrows: 'absolute top-1/2 left-0 right-0 sm:left-16 sm:right-16' }"
    class="w-full flex-1 rounded-md bg-white"
  >
    <NuxtLink :to="item.link" class="block h-full w-full">
      <!-- Only the first banner is on screen when the page opens. The others
           wait until the carousel brings them near the view. -->
      <NuxtImg
        :src="item.image"
        :alt="item.alt"
        :loading="index === 0 ? 'eager' : 'lazy'"
        class="aspect-[50/33] h-full w-full rounded-sm object-cover"
      />
    </NuxtLink>
  </UCarousel>
</template>
