<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

const columns: FooterColumn[] = [
  {
    label: 'Date comerciale',
    children: [
      {
        label: 'Eurotimalex SRL',
        to: 'https://eurotimalex.ro',
        target: '_blank'
      },
      {
        label: 'RO18034200',
      },
      {
        label: 'J2000000604084',
      },
      {
        label: 'Strada Drumul Taberei Nr. 92',
      },
      {
        label: 'Sector 6, Bucuresti',
      }
    ]
  },
  {
    label: 'Informatii utile',
    children: [
      {
        label: 'Termeni si conditii',
        to: '/termeni-si-conditii',
        exactHash: true
      },
      {
        label: 'Politica de confidentialitate',
        to: '/politica-de-confidentialitate'
      },
      {
        label: 'Livrare si retur',
        to: '/termeni-si-conditii#livrare-si-retur',
        exactHash: true
      },
      {
        label: 'Contact',
        to: '/contact'
      },
      {
        label: 'ANPC',
        to: 'https://anpc.ro/',
        target: '_blank'
      }
    ]
  }
]
</script>

<template>
  <div class="bg-white border-t border-gray-200 dark:border-gray-800">
    <UContainer>
      <UFooterColumns :columns="columns" class="py-8">
        <template #right>
          <div class="flex flex-col gap-4">
            <a href="https://netopia-payments.com/" target="_blank">
              <div class="flex gap-2">
                  <img src="/footerImg/np-black-0.svg" alt="Netopia Payments" class="h-8" />
              </div>
            </a>
            <a href="https://reclamatiisal.anpc.ro/" target="_blank">
              <div class="flex gap-2">
                  <img src="/footerImg/sal.webp" alt="SAL" class="h-8" />
                  <img src="/footerImg/sol.webp" alt="SOL" class="h-8" />
              </div>
            </a>
          </div>
        </template>
      </UFooterColumns>
    </UContainer>
  </div>
</template>
