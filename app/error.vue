<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error?.statusCode === 404)

useSeoMeta({
  title: () => (is404.value ? 'Pagina nu a fost gasita' : 'Eroare neasteptata')
})

const goTo = (path: string) => {
  if (import.meta.client) {
    window.location.href = path
  }
}
</script>

<template>
  <NuxtLayout name="default">
    <div class="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <UPageCard class="w-full max-w-md ring-0">
        <div class="flex flex-col items-center gap-5 px-2 py-4 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UIcon
              :name="is404 ? 'i-lucide-mouse-pointer-2-off' : 'i-lucide-circle-alert'"
              class="h-8 w-8 text-primary"
            />
          </div>

          <div class="space-y-2">
            <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase sm:text-sm">
              Eroare {{ error?.statusCode || 500 }}
            </p>
            <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
              {{ is404 ? 'Pagina nu a fost gasita' : 'Ceva nu a mers cum trebuie' }}
            </h1>
            <p class="mx-auto max-w-xs text-sm text-gray-500 sm:max-w-sm sm:text-base">
              <template v-if="is404">
                Adresa pe care ai accesat-o nu exista sau a fost mutata. Verifica linkul sau
                intoarce-te la pagina principala.
              </template>
              <template v-else>
                A aparut o eroare de server. Te rugam sa incerci din nou in cateva momente. Daca
                problema persista, ne poti contacta.
              </template>
            </p>
          </div>

          <div class="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <UButton
              size="lg"
              color="primary"
              variant="solid"
              class="justify-center rounded-md font-semibold"
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
              class="justify-center rounded-md font-semibold"
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
              class="justify-center rounded-md font-semibold"
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
