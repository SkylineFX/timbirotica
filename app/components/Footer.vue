<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

const columns: FooterColumn[] = [
  {
    label: 'Date comerciale',
    children: [
      {
        label: 'eMAG Marketplace SRL',
        to: 'https://nuxters.nuxt.com',
        target: '_blank'
      },
      {
        label: 'RO34901127',
      },
      {
        label: 'J2000000604084',
      },
      {
        label: 'B-dul Dimitrie Pompei 12A',
      },
      {
        label: 'Sector 2, Bucuresti',
      }
    ]
  },
  {
    label: 'Informatii utile',
    children: [
      {
        label: 'Termeni si conditii',
        to: '',
        target: '_blank'
      },
      {
        label: 'Politica de confidentialitate',
        to: '',
        target: '_blank'
      },
      {
        label: 'Livrare si retur',
        to: '',
        target: '_blank'
      },
      {
        label: 'Contact',
        to: '',
        target: '_blank'
      }
    ]
  }
]
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-800">
    <UContainer>
      <UFooterColumns :columns="columns" class="py-8">
        <template #right>
          <div class="flex flex-col gap-4">
            <div class="flex gap-2">
                <img src="/footerImg/np-black-0.svg" alt="Netopia Payments" class="h-8" />
            </div>
            <div class="flex gap-2">
                <img src="/footerImg/sal.webp" alt="SAL" class="h-8" />
                <img src="/footerImg/sol.webp" alt="SOL" class="h-8" />
            </div>
          </div>
        </template>
      </UFooterColumns>
    </UContainer>
  </div>
</template>
