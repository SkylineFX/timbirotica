<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error?.statusCode === 404)

useSeoMeta({
  title: () => is404.value ? 'Pagina nu a fost gasita' : 'Eroare neasteptata'
})

const goTo = (path: string) => {
  if (import.meta.client) {
    window.location.href = path
  }
}
</script>

<template>
  <NuxtLayout name="default">
    <div class="flex-1 flex flex-col items-center justify-center gap-4 p-4">
      <UPageCard class="w-full max-w-md ring-0">
        <div class="flex flex-col items-center gap-5 text-center py-4 px-2">
          <div class="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <UIcon
              :name="is404 ? 'i-lucide-mouse-pointer-2-off' : 'i-lucide-circle-alert'"
              class="w-8 h-8 text-primary"
            />
          </div>

          <div class="space-y-2">
            <p class="text-xs sm:text-sm font-semibold text-gray-500 tracking-widest uppercase">
              Eroare {{ error?.statusCode || 500 }}
            </p>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
              {{ is404 ? 'Pagina nu a fost gasita' : 'Ceva nu a mers cum trebuie' }}
            </h1>
            <p class="text-gray-500 text-sm sm:text-base max-w-xs sm:max-w-sm mx-auto">
              <template v-if="is404">
                Adresa pe care ai accesat-o nu exista sau a fost mutata. Verifica linkul sau intoarce-te la pagina principala.
              </template>
              <template v-else>
                A aparut o eroare de server. Te rugam sa incerci din nou in cateva momente. Daca problema persista, ne poti contacta.
              </template>
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2">
            <UButton
              size="lg"
              color="primary"
              variant="solid"
              class="rounded-md font-semibold justify-center"
              icon="i-lucide-home"
              @click="goTo('/')"
            >
              Inapoi acasa
            </UButton>
            <UButton
              v-if="is404"
              size="lg"
              color="neutral"
              variant="subtle"
              class="rounded-md font-semibold justify-center"
              icon="i-lucide-grid-2x2"
              @click="goTo('/c')"
            >
              Vezi categoriile
            </UButton>
            <UButton
              v-else
              size="lg"
              color="neutral"
              variant="subtle"
              class="rounded-md font-semibold justify-center"
              icon="i-lucide-mail"
              @click="goTo('/contact')"
            >
              Contacteaza-ne
            </UButton>
          </div>
        </div>
      </UPageCard>
    </div>
  </NuxtLayout>
</template>
