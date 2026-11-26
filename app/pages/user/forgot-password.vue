<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { fetchFailure } from '~~/shared/utils/fetchFailure'

// Open to signed-in users too: someone signed in may still need a reset link.
const toast = useToast()
const submitted = ref(false)
const turnstileToken = ref('')
const turnstile = useTemplateRef('turnstile')

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Introduceti adresa de email',
    required: true
  }
]

const schema = z.object({
  email: z.email('Adresa de email nu este valida')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: payload.data.email, turnstileToken: turnstileToken.value }
    })
    submitted.value = true
  } catch (err) {
    turnstileToken.value = ''
    turnstile.value?.reset()
    toast.add({
      title: 'Eroare',
      description: fetchFailure(err).message || 'A aparut o eroare. Te rugam sa incerci din nou.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <template v-if="submitted">
        <div class="flex flex-1 flex-col items-center gap-4 px-2 py-6 text-center">
          <UIcon name="i-lucide-mail-check" class="h-12 w-12 text-primary" />
          <h2 class="text-xl font-bold text-gray-900">Verifica-ti emailul</h2>
          <p class="text-sm text-gray-500">
            Daca adresa introdusa exista in sistemul nostru, vei primi in cateva minute un email cu
            instructiuni de resetare a parolei.
          </p>
          <UButton to="/user/login" variant="subtle" color="neutral" class="mt-2">
            Inapoi la autentificare
          </UButton>
        </div>
      </template>

      <template v-else>
        <UAuthForm
          :schema="schema"
          title="Resetare parola"
          icon="i-lucide-lock-keyhole"
          :fields="fields"
          :submit="{ label: 'Continua' }"
          @submit="onSubmit"
        >
          <template #description>
            Introdu adresa de email si iti vom trimite un link pentru a-ti reseta parola.
          </template>
          <template #footer>
            <ULink to="/user/login" class="text-sm font-medium text-primary"
              >Inapoi la autentificare</ULink
            >
          </template>
        </UAuthForm>
      </template>
    </UPageCard>
    <div v-if="!submitted" class="mt-2 flex justify-center">
      <NuxtTurnstile ref="turnstile" v-model="turnstileToken" />
    </div>
  </div>
</template>
