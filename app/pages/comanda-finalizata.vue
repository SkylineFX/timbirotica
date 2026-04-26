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
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl border border-gray-100 shadow-sm text-center">
      <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
        <UIcon name="i-lucide-check" class="h-10 w-10 text-green-600" />
      </div>
      
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">Comandă plasată!</h2>
      
      <p class="mt-2 text-sm text-gray-600">
        Îți mulțumim pentru comanda ta. Numărul comenzii tale este:
      </p>
      
      <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 inline-block w-full">
        <span class="font-mono text-xl font-bold text-gray-900 tracking-wider">{{ orderNumber }}</span>
      </div>

      <div class="mt-6 text-[15px] text-gray-600 text-left space-y-4 bg-blue-50/50 p-5 rounded-lg border border-blue-100/50">
        <template v-if="paymentMethod === 'transfer'">
          <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
             <div class="flex flex-col gap-1">
                <p><strong>Următorul pas:</strong> Vei primi pe email factura proformă cu detaliile contului bancar pentru a efectua plata prin transfer.</p>
                <p class="text-sm">Te rugăm să specifici numărul comenzii la detaliile plății.</p>
             </div>
          </div>
        </template>
        <template v-else-if="paymentMethod === 'cash'">
          <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
             <div class="flex flex-col gap-1">
                <p><strong>Următorul pas:</strong> Plata se va efectua în numerar la livrare. Te vom contacta în curând telefonic pentru confirmare și detaliile de expediere.</p>
             </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
             <div class="flex flex-col gap-1">
                <p>Te vom contacta în curând pentru confirmare și detalii.</p>
             </div>
          </div>
        </template>
      </div>

      <div class="mt-8">
        <NuxtLink to="/">
          <UButton block size="xl" color="neutral" variant="solid" class="rounded-md font-semibold font-lg justify-center w-full bg-gray-900 text-white hover:bg-gray-800">
             Întoarce-te la magazin
          </UButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
