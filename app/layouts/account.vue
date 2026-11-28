<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'General', icon: 'i-lucide-user', to: '/user' },
  { label: 'Adrese', icon: 'i-lucide-map-pin', to: '/user/adrese' },
  { label: 'Companii', icon: 'i-lucide-building-2', to: '/user/companii' },
  { label: 'Comenzi', icon: 'i-lucide-package', to: '/user/comenzi' }
]

const activeTab = computed<string>({
  get: () => {
    const found = tabs.find((t) => t.to === route.path)
    return found?.to ?? '/user'
  },
  set: (val) => {
    navigateTo(val)
  }
})
</script>

<template>
  <NuxtLayout name="default">
    <UContainer class="flex w-full max-w-5xl flex-1 flex-col py-8 lg:py-12">
      <h1 class="mb-6 text-2xl font-bold lg:text-3xl">Contul meu</h1>
      <!-- Vertical on phones, horizontal from md up. UTabs takes one fixed
           orientation, and the server can't know the screen width: choosing
           it in JavaScript rendered the phone tabs on the server, and desktop
           page loads kept them. Two tab bars let CSS choose instead. -->
      <UTabs
        v-model="activeTab"
        :items="tabs"
        variant="link"
        value-key="to"
        orientation="vertical"
        class="mb-6 md:hidden"
      />
      <UTabs
        v-model="activeTab"
        :items="tabs"
        variant="link"
        value-key="to"
        orientation="horizontal"
        class="mb-6 hidden md:flex"
      />
      <slot />
    </UContainer>
  </NuxtLayout>
</template>
