<script setup lang="ts">
const props = defineProps<{ productImages: string[] }>()

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)
</script>

<template>
  <div class="flex-1 w-full h-full flex flex-col gap-4">
    <div class="w-full bg-white rounded-lg border border-gray-100 flex items-center justify-center p-4 md:p-6 md:px-16 relative">
      <UCarousel
        ref="carousel"
        v-slot="{ item }"
        :items="productImages"
        class="w-full"
        @select="activeIndex = $event"
        arrows
        :ui="{arrows: 'hidden sm:block absolute top-1/2 -left-4 -right-4 sm:left-0 sm:right-0'}"
      >
        <NuxtImg :src="item" class="w-full aspect-square object-contain select-none block mx-auto pointer-events-none rounded-sm" draggable="false" alt="Imagine Produs"> </NuxtImg>
      </UCarousel>
    </div>

    <div v-if="productImages.length > 0" class="flex gap-2 justify-start">
      <div
        v-for="(item, index) in productImages"
        :key="index"
        class="w-16 h-16 shrink-0 rounded-md border-2 bg-white flex items-center justify-center p-0.5 cursor-pointer transition-all"
        :class="activeIndex === index ? 'border-primary' : 'border-gray-200 opacity-60 hover:opacity-100'"
        @click="carousel?.emblaApi?.scrollTo(index); activeIndex = index"
      >
        <NuxtImg :src="item" class="w-full h-full object-contain rounded-sm" alt="Imagine Produs"> </NuxtImg>
      </div>
    </div>
  </div>
</template>
