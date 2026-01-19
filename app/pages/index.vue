<script setup lang="ts">
definePageMeta({
  middleware: ['authenticated'],
})

const { user, clear: clearSession } = useUserSession()

async function logout () {
  await clearSession()
  await navigateTo('/login')
}
</script>


<template>
  <div>
    <Header />
    <Banner />
    <UContainer class="py-4">
      <!-- <HeroCarousel /> -->
    </UContainer>
    
    <p v-if="user">Welcome {{ user }}</p>
    <UContainer>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 my-12">
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-truck" class="text-4xl text-primary-500 mb-1" />
              <h3 class="font-bold">Livrare rapida</h3>
              <p class="text-sm text-gray-500">Livrare rapida in Bucuresti</p>
          </UCard>
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-shield-check" class="text-4xl text-primary-500 mb-1" />
              <h3 class="font-bold">Modalitati de plata</h3>
              <p class="text-sm text-gray-500">Ramburs la livrare sau cu cardul online</p>
          </UCard>
          <UCard class="text-center rounded-sm">
              <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary-500 mb-1" />
              <h3 class="font-bold">Consultanta gratuita</h3>
              <p class="text-sm text-gray-500">Ai o nelamurire? Contacta-ne!</p>
          </UCard>
      </div>
    </UContainer>

    <UContainer>
      <CategoryCarousel />
    </UContainer>
  </div>
</template>
  