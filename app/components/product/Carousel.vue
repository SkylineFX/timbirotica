<script setup lang="ts">
defineProps<{ productImages: string[] }>()

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)

function onClickPrev() {
  activeIndex.value--
}
function onClickNext() {
  activeIndex.value++
}
function onSelect(index: number) {
  activeIndex.value = index
}

function select(index: number) {
  activeIndex.value = index

  carousel.value?.emblaApi?.scrollTo(index)
}
</script>

<template>
  <div class="flex-1 w-full">
    <UCarousel
      ref="carousel"
      v-slot="{ item }"
      :items="productImages"
      :prev="{ onClick: onClickPrev }"
      :next="{ onClick: onClickNext }"
      class="w-full max-w-xs mx-auto"
      @select="onSelect"
      arrows
    >
      <img :src="item" class="w-full h-full object-contain aspect-square rounded-lg" draggable="false">
    </UCarousel>

    <div class="flex gap-1 justify-between pt-4 max-w-xs mx-auto">
      <div
        v-for="(item, index) in productImages"
        :key="index"
        class="size-11 opacity-25 hover:opacity-100 transition-opacity"
        :class="{ 'opacity-100': activeIndex === index }"
        @click="select(index)"
      >
        <img :src="item" class="w-full h-full object-cover rounded-lg">
      </div>
    </div>
  </div>
</template>

