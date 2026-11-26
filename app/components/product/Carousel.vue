<script setup lang="ts">
defineProps<{ productImages: string[] }>()

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)

// A function, not an inline handler with two statements: without
// semicolons (the repo's Prettier style) Vue can't parse those.
const showImage = (index: number) => {
  carousel.value?.emblaApi?.scrollTo(index)
  activeIndex.value = index
}
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col gap-4">
    <div
      class="relative flex w-full items-center justify-center rounded-lg border border-gray-100 bg-white p-4 md:p-6 md:px-16"
    >
      <UCarousel
        ref="carousel"
        v-slot="{ item }"
        :items="productImages"
        class="w-full"
        arrows
        :ui="{ arrows: 'hidden sm:block absolute top-1/2 -left-4 -right-4 sm:left-0 sm:right-0' }"
        @select="activeIndex = $event"
      >
        <NuxtImg
          :src="item"
          class="pointer-events-none mx-auto block aspect-square w-full rounded-sm object-contain select-none"
          draggable="false"
          alt="Imagine Produs"
        >
        </NuxtImg>
      </UCarousel>
    </div>

    <div v-if="productImages.length > 0" class="flex justify-start gap-2">
      <div
        v-for="(item, index) in productImages"
        :key="index"
        class="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 bg-white p-0.5 transition-all"
        :class="
          activeIndex === index ? 'border-primary' : 'border-gray-200 opacity-60 hover:opacity-100'
        "
        @click="showImage(index)"
      >
        <NuxtImg :src="item" class="h-full w-full rounded-sm object-contain" alt="Imagine Produs">
        </NuxtImg>
      </div>
    </div>
  </div>
</template>
