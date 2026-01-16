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
    <Banner />
    <UContainer class="py-4">
      <HeroCarousel />
    </UContainer>
    
    <p v-if="user">Welcome {{ user }}</p>
    <UContainer>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
          <UCard class="text-center">
              <UIcon name="i-heroicons-truck" class="text-4xl text-primary-500 mb-1" />
              <h3 class="font-bold">Fast Delivery</h3>
              <p class="text-sm text-gray-500">Shipping within 24 hours</p>
          </UCard>
          <UCard class="text-center">
              <UIcon name="i-heroicons-shield-check" class="text-4xl text-primary-500 mb-1" />
              <h3 class="font-bold">Secure Payment</h3>
              <p class="text-sm text-gray-500">100% secure payment</p>
          </UCard>
          <UCard class="text-center">
              <UIcon name="i-heroicons-arrow-path" class="text-4xl text-primary-500 mb-1" />
              <h3 class="font-bold">Easy Returns</h3>
              <p class="text-sm text-gray-500">30 days return policy</p>
          </UCard>
      </div>
    </UContainer>

    <UContainer>
      <CategoryCarousel />
    </UContainer>
  </div>
</template>
  