<script setup lang="ts">
const { data: categoryTree } = useFetch('/api/categories/tree')
const { data: brands } = useFetch('/api/brands')

const navigation = computed(() => [
  {
    label: 'Toate Produsele',
    to: '/c',
    children: categoryTree.value || [],
    open: true,
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  },
])

const featuredCategories = [
  {
    title: "Produse recomandate",
    categoryId: 163
  },
  {
    categoryId: 162
  },
  {
    categoryId: 73
  }
]

</script>

<template>
  <div>
    <UContainer class="my-6 flex gap-4">
      <div class="h-64 lg:h-120 justify-start items-start bg-white rounded-md overflow-y-auto hidden lg:flex lg:flex-1 lg:flex-col lg:basis-md">
        <UNavigationMenu :items="navigation" orientation="vertical" type="single" class="w-full"/>
      </div>
      <HeroCarousel />
    </UContainer>
    
    <UContainer class="my-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 my-12">
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-truck" class="text-4xl text-primary mb-1" />
              <h3 class="font-bold">Livrare in Bucuresti</h3>
              <p class="text-sm text-gray-500">Livrare gratuita la comenzi >300 RON</p>
          </UCard>
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-credit-card" class="text-4xl text-primary mb-1" />
              <h3 class="font-bold">Modalitati de plata</h3>
              <p class="text-sm text-gray-500">Plata ramburs la livrare sau cu cardul online</p>
          </UCard>
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-information-circle" class="text-4xl text-primary mb-1" />
              <h3 class="font-bold">Serviciu asistenta</h3>
              <p class="text-sm text-gray-500">Ai o nelamurire? <NuxtLink to="/contact" class="text-primary underline">Contacteaza-ne!</NuxtLink></p>
          </UCard>
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary mb-1" />
              <h3 class="font-bold">Retur gratuit</h3>
              <p class="text-sm text-gray-500">Retur gratuit in 14 zile de la primirea coletului</p>
          </UCard>
      </div>
    </UContainer>

    <UContainer class="my-6 lg:my-8 flex flex-col gap-8">
      <CategoryCarousel 
        v-for="(carousel, index) in featuredCategories"
        :key="index"
        :title="carousel.title"
        :categoryId="carousel.categoryId"
      />
    </UContainer>
  </div>
</template>
  