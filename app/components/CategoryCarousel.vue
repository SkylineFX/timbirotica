<script setup lang="ts">
const items = [
  {
    id: 1,
    title: 'Product 1',
    price: 99.99,
    image: ''
  },
  {
    id: 2,
    title: 'Product 2',
    price: 149.99,
    image: ''
  },
  {
    id: 3,
    title: 'Product 3',
    price: 79.99,
    image: ''
  },
  {
    id: 4,
    title: 'Product 4',
    price: 199.99,
    image: ''
  },
  {
    id: 5,
    title: 'Product 5',
    price: 129.99,
    image: ''
  },
  {
    id: 6,
    title: 'Product 6',
    price: 89.99,
    image: ''
  }
]
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    :items="items"
    :ui="{ item: 'basis-1/2 sm:basis-1/3 lg:basis-1/5' }"
  >
    <UCard class="w-full m-2 rounded-sm">
      <template #header>
        <NuxtImg placeholder class="w-full h-24 object-cover" draggable="false" />
      </template>

      <div class="p-2">
        <h3 class="font-bold text-lg mb-1">{{ item.title }}</h3>
        <p class="text-gray-500 mb-4">{{ item.price }} RON</p>
      </div>

      <template #footer>
        <UButton block label="Adauga in cos" color="primary" />
      </template>
    </UCard>
  </UCarousel>
</template>

