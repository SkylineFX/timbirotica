<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Docs',
  to: '/docs/getting-started',
  icon: 'i-lucide-book-open',
  active: route.path.startsWith('/docs/getting-started')
}, {
  label: 'Components',
  to: '/docs/components',
  icon: 'i-lucide-box',
  active: route.path.startsWith('/docs/components')
}, {
  label: 'Figma',
  icon: 'i-simple-icons-figma',
  to: 'https://go.nuxt.com/figma-ui',
  target: '_blank'
}, {
  label: 'Releases',
  icon: 'i-lucide-rocket',
  to: 'https://github.com/nuxt/ui/releases',
  target: '_blank'
}])
</script>

<template>
  <UHeader toggle-side="left" mode="slideover">
    <template #title>
      <AppLogo class="h-6 w-auto" />
    </template>

    <UInput icon="i-lucide-search" size="md" variant="outline" placeholder="Search..." />

    <template #right>
      <UTooltip text="Shopping Cart" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="/cart"
          icon="i-lucide-shopping-cart"
          aria-label="Shopping Cart"
        />
      </UTooltip>

      <UTooltip text="My Account" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="/account"
          icon="i-lucide-user"
          aria-label="Shopping Cart"
        />
      </UTooltip>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>

