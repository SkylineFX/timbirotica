<script setup lang="ts">
const consent = useCookie<string | null>('cookie-consent', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax'
})

const visible = ref(false)

onMounted(() => {
  if (!consent.value) visible.value = true
})

function accept() {
  consent.value = 'accepted'
  visible.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div class="mx-auto max-w-3xl pointer-events-auto bg-white rounded-md shadow-lg border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p class="text-sm text-gray-700 leading-relaxed flex-1">
          Folosim doar cookie-uri strict necesare pentru funcționarea site-ului (autentificare, coș de cumpărături). Nu utilizăm cookie-uri de analiză sau publicitate.
          <NuxtLink to="/politica-de-confidentialitate#cookies" class="text-primary hover:underline font-medium">Detalii</NuxtLink>
        </p>
        <UButton color="primary" size="md" class="rounded-md justify-center" @click="accept">
          Am înțeles
        </UButton>
      </div>
    </div>
  </Transition>
</template>
