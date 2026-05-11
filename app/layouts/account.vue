<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const route = useRoute()

const tabs = [
  { label: 'General', icon: 'i-lucide-user', to: '/user' },
  { label: 'Adrese', icon: 'i-lucide-map-pin', to: '/user/adrese' },
  { label: 'Companii', icon: 'i-lucide-building-2', to: '/user/companii' },
  { label: 'Comenzi', icon: 'i-lucide-package', to: '/user/comenzi' }
]

const activeTab = computed<string>({
  get: () => {
    const found = tabs.find(t => t.to === route.path)
    return found?.to ?? '/user'
  },
  set: (val) => { navigateTo(val) }
})

const isDesktop = useMediaQuery('(min-width: 768px)')
const orientation = computed<'horizontal' | 'vertical'>(() => isDesktop.value ? 'horizontal' : 'vertical')
</script>

<template>
  <NuxtLayout name="default">
    <UContainer class="py-8 lg:py-12 max-w-5xl">
      <h1 class="text-2xl lg:text-3xl font-bold mb-6">Contul meu</h1>
      <UTabs
        v-model="activeTab"
        :items="tabs"
        variant="link"
        value-key="to"
        :orientation="orientation"
        class="mb-6"
      />
      <slot />
    </UContainer>
  </NuxtLayout>
</template>
