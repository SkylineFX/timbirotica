<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const items: DropdownMenuItem[][] = [
  [
    {
      label: 'Detalii cont',
      icon: 'i-lucide-user'
    },
    {
      label: 'Comenzile mele',
      icon: 'i-lucide-shopping-cart'
    },
  ],
  [
    {
      label: 'Deconectare',
      color: 'error',
      icon: 'i-lucide-log-out'
    }
  ]
]
</script>

<template>
  <UDropdownMenu :items="items" :ui="{ content: 'w-48' }">
    <UButton color="neutral" variant="ghost" icon="i-lucide-user">
      <span class="hidden md:inline">Contul meu</span>
    </UButton>
  </UDropdownMenu>
</template>

