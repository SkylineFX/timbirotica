<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest'
})

const toast = useToast()
const submitted = ref(false)
const turnstileToken = ref('')
const turnstile = useTemplateRef('turnstile')

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Introduceti adresa de email',
  required: true
}]

const schema = z.object({
  email: z.email('Adresa de email nu este valida')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: payload.data.email, turnstileToken: turnstileToken.value },
    })
    submitted.value = true
  } catch (err: any) {
    turnstileToken.value = ''
    turnstile.value?.reset()
    toast.add({ title: 'Eroare', description: err?.data?.message || 'A aparut o eroare. Te rugam sa incerci din nou.', color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <template v-if="submitted">
        <div class="flex flex-col flex-1 items-center gap-4 py-6 px-2 text-center">
          <UIcon name="i-lucide-mail-check" class="w-12 h-12 text-primary" />
          <h2 class="text-xl font-bold text-gray-900">Verifica-ti emailul</h2>
          <p class="text-gray-500 text-sm">
            Daca adresa introdusa exista in sistemul nostru, vei primi in cateva minute un email cu instructiuni de resetare a parolei.
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
            <ULink to="/user/login" class="text-primary font-medium text-sm">Inapoi la autentificare</ULink>
          </template>
        </UAuthForm>
      </template>
    </UPageCard>
    <div v-if="!submitted" class="flex justify-center mt-2">
      <NuxtTurnstile ref="turnstile" v-model="turnstileToken" />
    </div>
  </div>
</template>
