<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const toast = useToast()

const token = computed(() => {
  const q = route.query.token
  return Array.isArray(q) ? q[0] : (q ?? undefined)
})

if (!token.value) {
  await navigateTo('/user/forgot-password')
}

const fields: AuthFormField[] = [{
  name: 'password',
  type: 'password',
  label: 'Parolă nouă',
  placeholder: 'Minimum 8 caractere',
  required: true
}, {
  name: 'confirmPassword',
  type: 'password',
  label: 'Confirmă parola',
  placeholder: 'Repetați parola nouă',
  required: true
}]

const schema = z.object({
  password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const tokenInvalid = ref(false)

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: payload.data.password }
    })
    toast.add({ title: 'Parolă resetată', description: 'Te poți autentifica cu noua parolă.', color: 'success' })
    await navigateTo('/user/login')
  } catch (err: any) {
    if (err.statusCode === 400) {
      tokenInvalid.value = true
    } else {
      toast.add({ title: 'Eroare', description: 'A apărut o eroare. Te rugăm să încerci din nou.', color: 'error' })
    }
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <template v-if="tokenInvalid">
        <div class="flex flex-col items-center gap-4 py-6 px-2 text-center">
          <UIcon name="i-lucide-link-2-off" class="w-12 h-12 text-red-500" />
          <h2 class="text-xl font-bold text-gray-900">Link invalid sau expirat</h2>
          <p class="text-gray-500 text-sm">
            Acest link de resetare nu mai este valabil. Linkurile expiră după 1 oră și pot fi folosite o singură dată.
          </p>
          <UButton to="/user/forgot-password" color="primary" variant="subtle" class="mt-2">
            Solicită un nou link
          </UButton>
        </div>
      </template>

      <template v-else>
        <UAuthForm
          :schema="schema"
          title="Parolă nouă"
          icon="i-lucide-lock-keyhole"
          :fields="fields"
          submit-label="Setează parola nouă"
          @submit="onSubmit"
        >
          <template #description>
            Introdu noua parolă pentru contul tău.
          </template>
        </UAuthForm>
      </template>
    </UPageCard>
  </div>
</template>
