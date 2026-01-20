<script setup lang="ts">
</script>

<template>
  <div>
    <UContainer>
      <!-- <HeroCarousel /> -->
    </UContainer>
    
    <UContainer>
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

    <UContainer>
      <h3 class="text-2xl font-bold mb-4">Produse populare</h3>
      <CategoryCarousel />
    </UContainer>
  </div>
</template>
  