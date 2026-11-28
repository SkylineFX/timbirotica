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
    <div v-if="visible" class="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div
        class="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-sm border border-gray-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:p-5"
      >
        <p class="flex-1 text-sm leading-relaxed text-gray-700">
          Folosim doar cookie-uri strict necesare pentru functionarea site-ului si monitorizarea
          performantei. Nu utilizam cookie-uri de analiza a profilului de cumparator sau
          publicitate.
          <NuxtLink
            to="/politica-de-confidentialitate#cookies"
            class="font-medium text-primary hover:underline"
            >Detalii</NuxtLink
          >
        </p>
        <UButton color="primary" size="sm" class="justify-center rounded-sm" @click="accept">
          Am inteles
        </UButton>
      </div>
    </div>
  </Transition>
</template>
