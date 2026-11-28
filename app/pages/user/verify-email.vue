<script setup lang="ts">
import { fetchFailure } from '~~/shared/utils/fetchFailure'

const route = useRoute()
const toast = useToast()
const { loggedIn } = useUserSession()
const { cartItems } = useCart()

const token = computed(() => {
  const q = route.query.token
  return Array.isArray(q) ? q[0] : (q ?? undefined)
})

const status = ref<'pending' | 'success' | 'already-verified' | 'invalid' | 'error'>('pending')
const redirectIn = ref(5)
let redirectTimer: ReturnType<typeof setInterval> | null = null

// Checkout only makes sense with products in the cart. The header loads the
// cart when the page mounts, so it is known well before the countdown ends.
const goesToCheckout = computed(() => loggedIn.value && cartItems.value.length > 0)
const redirectTarget = computed(() => {
  if (!loggedIn.value) return '/user/login'
  return goesToCheckout.value ? '/checkout' : '/'
})
const redirectDestination = computed(() =>
  goesToCheckout.value ? 'catre finalizarea comenzii' : 'catre pagina principala'
)

function startRedirect() {
  redirectIn.value = loggedIn.value ? 5 : 10
  redirectTimer = setInterval(() => {
    redirectIn.value -= 1
    if (redirectIn.value <= 0) {
      if (redirectTimer) clearInterval(redirectTimer)
      navigateTo(redirectTarget.value)
    }
  }, 1000)
}

onMounted(async () => {
  if (!token.value) {
    status.value = 'invalid'
    return
  }
  try {
    await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { token: token.value }
    })
    status.value = 'success'
    startRedirect()
  } catch (err) {
    if (fetchFailure(err).status === 400) {
      try {
        const result = await $fetch<{ verified: boolean }>('/api/auth/verification-status')
        if (result.verified) {
          status.value = 'already-verified'
          startRedirect()
          return
        }
      } catch {
        // not logged in or other error — fall through to invalid
      }
      status.value = 'invalid'
    } else {
      status.value = 'error'
    }
  }
})

const isResending = ref(false)
const resendCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown(seconds: number) {
  resendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value -= 1
    if (resendCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

async function resendVerification() {
  isResending.value = true
  try {
    await $fetch('/api/auth/send-verification', { method: 'POST' })
    toast.add({
      title: 'Email trimis',
      description: 'Verifica casuta de email pentru noul link de confirmare.',
      color: 'success'
    })
    startCooldown(60)
  } catch (e) {
    const failure = fetchFailure(e)
    if (failure.status === 401) {
      toast.add({
        title: 'Autentificare necesara',
        description: 'Conecteaza-te in cont si reincearca.',
        color: 'error'
      })
      navigateTo('/user/login')
      return
    }
    const retryAfter = failure.data.retryAfter
    if (failure.status === 429 && typeof retryAfter === 'number' && retryAfter) {
      startCooldown(retryAfter)
      return
    }
    toast.add({
      title: 'Eroare',
      description: failure.message || 'Nu am putut trimite emailul. Incearca din nou.',
      color: 'error'
    })
  } finally {
    isResending.value = false
  }
}

onUnmounted(() => {
  if (redirectTimer) clearInterval(redirectTimer)
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div
        v-if="status === 'pending'"
        class="flex flex-col items-center gap-4 px-2 py-6 text-center"
      >
        <UIcon name="i-lucide-loader-2" class="h-12 w-12 animate-spin text-primary" />
        <h2 class="text-xl font-bold text-gray-900">Confirmam adresa de email...</h2>
      </div>

      <div
        v-else-if="status === 'success'"
        class="flex flex-col items-center gap-4 px-2 py-6 text-center"
      >
        <UIcon name="i-lucide-mail-check" class="h-12 w-12 text-primary" />
        <h2 class="text-xl font-bold text-gray-900">Adresa de email confirmata</h2>
        <p v-if="loggedIn" class="text-sm text-gray-500">
          Iti multumim. Vei fi redirectionat {{ redirectDestination }} in {{ redirectIn }}
          {{ redirectIn === 1 ? 'secunda' : 'secunde' }}.
        </p>
        <p v-else class="text-sm text-gray-500">
          Iti multumim. Poti inchide aceasta fereastra, sau poti continua aici dupa autentificare.
          Vei fi redirectionat in {{ redirectIn }} {{ redirectIn === 1 ? 'secunda' : 'secunde' }}.
        </p>
        <UButton :to="redirectTarget" color="primary" variant="solid" class="mt-2 rounded-sm">
          {{ loggedIn ? 'Continua acum' : 'Autentifica-te' }}
        </UButton>
      </div>

      <div
        v-else-if="status === 'already-verified'"
        class="flex flex-col items-center gap-4 px-2 py-6 text-center"
      >
        <UIcon name="i-lucide-mail-check" class="h-12 w-12 text-primary" />
        <h2 class="text-xl font-bold text-gray-900">Contul este deja confirmat</h2>
        <p v-if="loggedIn" class="text-sm text-gray-500">
          Adresa de email a fost deja confirmata. Vei fi redirectionat {{ redirectDestination }} in
          {{ redirectIn }} {{ redirectIn === 1 ? 'secunda' : 'secunde' }}.
        </p>
        <p v-else class="text-sm text-gray-500">
          Adresa de email a fost deja confirmata. Poti inchide aceasta fereastra, sau poti continua
          aici dupa autentificare. Vei fi redirectionat in {{ redirectIn }}
          {{ redirectIn === 1 ? 'secunda' : 'secunde' }}.
        </p>
        <UButton :to="redirectTarget" color="primary" variant="solid" class="mt-2 rounded-sm">
          {{ loggedIn ? 'Continua acum' : 'Autentifica-te' }}
        </UButton>
      </div>

      <div
        v-else-if="status === 'invalid'"
        class="flex flex-col items-center gap-4 px-2 py-6 text-center"
      >
        <UIcon name="i-lucide-link-2-off" class="h-12 w-12 text-red-500" />
        <h2 class="text-xl font-bold text-gray-900">Link invalid sau expirat</h2>
        <p class="text-sm text-gray-500">
          Acest link de confirmare nu mai este valabil. Apasa butonul de mai jos pentru a primi un
          email nou.
        </p>
        <UButton
          color="primary"
          variant="solid"
          :loading="isResending"
          :disabled="resendCooldown > 0"
          class="mt-2 rounded-sm"
          @click="resendVerification"
        >
          {{ resendCooldown > 0 ? `Trimite din nou (${resendCooldown}s)` : 'Trimite un email nou' }}
        </UButton>
      </div>

      <div v-else class="flex flex-col items-center gap-4 px-2 py-6 text-center">
        <UIcon name="i-lucide-circle-alert" class="h-12 w-12 text-red-500" />
        <h2 class="text-xl font-bold text-gray-900">A aparut o eroare</h2>
        <p class="text-sm text-gray-500">Te rugam sa incerci din nou in cateva minute.</p>
      </div>
    </UPageCard>
  </div>
</template>
