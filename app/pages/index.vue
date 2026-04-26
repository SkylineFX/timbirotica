<script setup lang="ts">
const { data: categoryTree } = useFetch('/api/categories/tree')
const { data: brands } = useFetch('/api/brands')

const navigation = computed(() => [
  {
    label: 'Produse',
    to: '/c',
    children: categoryTree.value || [],
    open: true,
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  },
  {
    label: 'Recomandate',
    to: '/produse-recomandate'
  }
])

const featuredCategories = [
  {
    title: "Produse recomandate",
    recommended: true
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
    <UContainer class="my-6 grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4 items-stretch">
      <div class="bg-white rounded-md hidden lg:block relative">
        <div class="absolute inset-0 overflow-y-auto">
          <UNavigationMenu :items="navigation" orientation="vertical" type="single" class="w-full"/>
        </div>
      </div>
      <HeroCarousel class="w-full min-w-0" />
    </UContainer>
    
    <UContainer class="my-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 my-12">
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-truck" class="text-4xl text-primary mb-1" />
              <h3 class="font-bold">Livrare in Bucuresti</h3>
              <p class="text-sm text-gray-500">Livrare gratuita la comenzi >200 RON</p>
          </UCard>
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-credit-card" class="text-4xl text-primary mb-1" />
              <h3 class="font-bold">Modalitati de plata</h3>
              <p class="text-sm text-gray-500">Plata ramburs la livrare sau prin virament bancar</p>
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
        :recommended="carousel.recommended"
      />
    </UContainer>

    <UContainer class="my-6 lg:my-12 flex flex-col gap-4">
      <div class="flex items-center justify-between sm:justify-start items-baseline border-b border-gray-200 pb-1">
        <h3 class="text-xl lg:text-2xl font-bold">Marci populare</h3>
        <UButton class="text-xs py-0 self-center" to="/producatori" color="primary" variant="link">
          <span class="block sm:hidden">Vezi tot</span>
          <template #trailing>
            <UIcon name="i-lucide-arrow-right" class="w-4 sm:w-5 h-4 sm:h-5 mt-0 sm:mt-1" />
          </template>
        </UButton>
      </div>
      <BrandMarquee />
    </UContainer>
  </div>
</template>
  