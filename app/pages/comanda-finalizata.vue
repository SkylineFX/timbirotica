<script setup lang="ts">
import { useRoute } from 'vue-router'

definePageMeta({
  middleware: ['authenticated'],
})

const route = useRoute()
const orderNumber = route.query.order
const paymentMethod = route.query.payment

if (!orderNumber) {
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-6 md:p-8 lg:p-10 rounded-md border border-gray-200 text-center">
      <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
        <UIcon name="i-lucide-check" class="h-10 w-10 text-green-600" />
      </div>
      
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">Comanda plasata!</h2>
      
      <p class="mt-2 text-sm lg:text-base text-gray-600">
        Iti multumim pentru comanda. Numarul comenzii tale este:
      </p>
      
      <div class="mt-4 p-4 bg-gray-50 rounded-sm border border-gray-200 inline-block w-full">
        <span class="font-mono text-xl font-bold text-gray-900 tracking-wider">#{{ orderNumber }}</span>
      </div>

      <div class="mt-4 text-sm text-gray-600 text-left space-y-4 bg-gray-50/50 p-5 rounded-sm border border-blue-100/50">
        <template v-if="paymentMethod === 'transfer'">
          <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
             <div class="flex flex-col gap-1">
                <p><strong>Urmatorul pas:</strong> Vei primi pe email factura proforma cu detaliile contului bancar pentru a efectua plata prin transfer.</p>
                <!-- <p class="text-sm">Te rugam sa specifici numarul comenzii la detaliile platii.</p> -->
             </div>
          </div>
        </template>
        <template v-else-if="paymentMethod === 'cash'">
          <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
             <div class="flex flex-col gap-1">
                <p><strong>Urmatorul pas:</strong> Plata se va efectua in numerar la livrare. Te vom contacta in curand telefonic pentru confirmare si detaliile de expediere.</p>
             </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
             <div class="flex flex-col gap-1">
                <p>Te vom contacta in curand pentru confirmare si detalii.</p>
             </div>
          </div>
        </template>
      </div>

      <div class="mt-8 flex flex-col gap-2">
        <NuxtLink to="/user/comenzi">
          <UButton block size="lg" color="primary" variant="subtle" class="rounded-md font-semibold text-sm justify-center w-full">
             Vezi istoricul comenzilor
          </UButton>
        </NuxtLink>

        <NuxtLink to="/">
          <UButton block size="xl" color="primary" variant="solid" class="rounded-md font-semibold text-lg justify-center w-full">
             Intoarce-te la magazin
          </UButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
