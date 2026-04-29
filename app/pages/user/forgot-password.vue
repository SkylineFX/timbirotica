<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest'
})

const toast = useToast()
const submitted = ref(false)

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Introduceți adresa de email',
  required: true
}]

const schema = z.object({
  email: z.email('Adresa de email nu este validă')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: payload.data.email }
    })
    submitted.value = true
  } catch {
    toast.add({ title: 'Eroare', description: 'A apărut o eroare. Te rugăm să încerci din nou.', color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <template v-if="submitted">
        <div class="flex flex-col items-center gap-4 py-6 px-2 text-center">
          <UIcon name="i-lucide-mail-check" class="w-12 h-12 text-primary" />
          <h2 class="text-xl font-bold text-gray-900">Verifică-ți emailul</h2>
          <p class="text-gray-500 text-sm">
            Dacă adresa introdusă există în sistemul nostru, vei primi în câteva minute un email cu instrucțiuni de resetare a parolei.
          </p>
          <UButton to="/user/login" variant="subtle" color="neutral" class="mt-2">
            Înapoi la autentificare
          </UButton>
        </div>
      </template>

      <template v-else>
        <UAuthForm
          :schema="schema"
          title="Resetare parolă"
          icon="i-lucide-lock-keyhole"
          :fields="fields"
          submit-label="Trimite link de resetare"
          @submit="onSubmit"
        >
          <template #description>
            Introdu adresa de email și îți vom trimite un link pentru a-ți reseta parola.
          </template>
          <template #footer>
            <ULink to="/user/login" class="text-primary font-medium text-sm">Înapoi la autentificare</ULink>
          </template>
        </UAuthForm>
      </template>
    </UPageCard>
  </div>
</template>
