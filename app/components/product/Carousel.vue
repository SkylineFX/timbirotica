<script setup lang="ts">
const props = defineProps<{ productImages: string[] }>()

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)
</script>

<template>
  <div class="flex-1 w-full h-full flex flex-col gap-4">
    <UCarousel
      ref="carousel"
      v-slot="{ item }"
      :items="productImages"
      class="w-full h-full bg-white rounded-lg border border-gray-100 relative overflow-hidden"
      @select="activeIndex = $event"
      arrows
      :prev-button="{ color: 'gray', variant: 'soft', class: 'ml-2 pointer-events-auto' }"
      :next-button="{ color: 'gray', variant: 'soft', class: 'mr-2 pointer-events-auto' }"
      :ui="{ 
        item: 'w-full h-full', 
        container: 'aspect-square'
      }"
    >
      <div class="w-full h-full p-4 flex justify-center items-center">
        <img :src="item" class="max-w-full max-h-full object-contain" draggable="false">
      </div>
    </UCarousel>

    <div v-if="productImages.length > 1" class="flex gap-2 justify-start">
      <div
        v-for="(item, index) in productImages"
        :key="index"
        class="w-16 h-16 shrink-0 rounded-md border-2 bg-white flex items-center justify-center p-1 cursor-pointer transition-all"
        :class="activeIndex === index ? 'border-primary' : 'border-gray-200 opacity-60 hover:opacity-100'"
        @click="carousel?.emblaApi?.scrollTo(index); activeIndex = index"
      >
        <img :src="item" class="max-w-full max-h-full object-contain">
      </div>
    </div>
  </div>
</template>
