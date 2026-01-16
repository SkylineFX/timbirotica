<script setup lang="ts">
const items = [
  'https://picsum.photos/640/640?random=1',
  'https://picsum.photos/640/640?random=2',
  'https://picsum.photos/640/640?random=3',
  'https://picsum.photos/640/640?random=4',
  'https://picsum.photos/640/640?random=5',
  'https://picsum.photos/640/640?random=6'
]
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    fade
    arrows
    dots
    :items="items"
    class="w-full max-w-fit mx-auto"
  >
    <img :src="item" class="rounded-sm h-64 w-full object-cover">
  </UCarousel>
</template>

