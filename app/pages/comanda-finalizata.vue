<script setup lang="ts">
import { useRoute } from 'vue-router'

definePageMeta({
  middleware: ['authenticated']
})

const route = useRoute()
const orderNumber = route.query.order
const paymentMethod = route.query.payment
const shippingMethod = route.query.shipping

if (!orderNumber) {
  navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div
      class="w-full max-w-md space-y-8 rounded-md border border-gray-200 bg-white p-6 text-center md:p-8 lg:p-10"
    >
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <UIcon name="i-lucide-check" class="h-10 w-10 text-green-600" />
      </div>

      <h2 class="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">Comanda plasata!</h2>

      <p class="mt-2 text-sm text-gray-600 lg:text-base">
        Iti multumim pentru comanda. Numarul comenzii tale este:
      </p>

      <div class="mt-4 inline-block w-full rounded-sm border border-gray-200 bg-gray-50 p-4">
        <span class="font-mono text-xl font-bold tracking-wider text-gray-900"
          >#{{ orderNumber }}</span
        >
      </div>

      <div
        class="mt-4 space-y-4 rounded-sm border border-blue-100/50 bg-gray-50/50 p-5 text-left text-sm text-gray-600"
      >
        <template v-if="paymentMethod === 'transfer'">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
            <div class="flex flex-col gap-1">
              <p>
                <strong>Urmatorul pas:</strong> Vei primi pe email factura proforma cu detaliile
                contului bancar pentru a efectua plata prin transfer.
              </p>
              <!-- <p class="text-sm">Te rugam sa specifici numarul comenzii la detaliile platii.</p> -->
            </div>
          </div>
        </template>
        <template v-else-if="paymentMethod === 'cash'">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
            <div class="flex flex-col gap-1">
              <p v-if="shippingMethod === 'pickup'">
                <strong>Urmatorul pas:</strong> Plata se va efectua in numerar la ridicare. Te vom
                contacta pe email cand comanda este gata.
              </p>
              <p v-else>
                <strong>Urmatorul pas:</strong> Plata se va efectua in numerar la livrare. Te vom
                contacta in curand telefonic pentru confirmare si detaliile de expediere.
              </p>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div class="flex flex-col gap-1">
              <p>Te vom contacta in curand pentru confirmare si detalii.</p>
            </div>
          </div>
        </template>
      </div>

      <div class="mt-8 flex flex-col gap-2">
        <NuxtLink to="/user/comenzi">
          <UButton
            block
            size="lg"
            color="primary"
            variant="subtle"
            class="w-full justify-center rounded-md text-sm font-semibold"
          >
            Vezi istoricul comenzilor
          </UButton>
        </NuxtLink>

        <NuxtLink to="/">
          <UButton
            block
            size="xl"
            color="primary"
            variant="solid"
            class="w-full justify-center rounded-md text-lg font-semibold"
          >
            Intoarce-te la magazin
          </UButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
