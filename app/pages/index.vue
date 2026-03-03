<script setup lang="ts">
const { data: categoryTree } = useFetch('/api/categories/tree')
const { data: brands } = useFetch('/api/brands')

const navigation = computed(() => [
  {
    label: 'Toate Produsele',
    to: '/categorii',
    children: categoryTree.value || [],
    open: true,
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  },
])
</script>

<template>
  <div>
    <UContainer class="my-6 flex gap-4">
      <div class="h-64 lg:h-120 justify-start items-start bg-gray-100 rounded-md overflow-y-auto hidden lg:flex lg:flex-1 lg:flex-col lg:basis-md">
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

    <UContainer class="my-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Produse populare</h3>
        <UButton class="text-sm" trailing-icon="i-lucide-arrow-right" label="Mai multe" to="/categorii" color="primary" variant="link" />
      </div>
      <CategoryCarousel url="/api/products?limit=6" />
    </UContainer>

    <UContainer class="my-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Hartie copiator</h3>
        <UButton class="text-sm" trailing-icon="i-lucide-arrow-right" label="Mai multe" to="/categorii/hartie-copiator" color="primary" variant="link" />
      </div>
      <CategoryCarousel url="/api/products?category=hartie-copiator&limit=6" />
    </UContainer>

    <UContainer class="my-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Pixuri</h3>
        <UButton class="text-sm" trailing-icon="i-lucide-arrow-right" label="Mai multe" to="/categorii/pixuri" color="primary" variant="link" />
      </div>
      <CategoryCarousel url="/api/products?category=pixuri&limit=6" />
    </UContainer>
  </div>
</template>
  