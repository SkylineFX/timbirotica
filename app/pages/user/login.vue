<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest'
})

const { fetch } = useUserSession()
const toast = useToast()
const turnstileToken = ref('')
const turnstile = useTemplateRef('turnstile')

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Introduceti adresa de email',
  required: true
}, {
  name: 'password',
  label: 'Parola',
  type: 'password',
  placeholder: 'Introduceti parola',
  required: true
}, {
  name: 'remember',
  label: 'Tine-ma minte',
  type: 'checkbox'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  to: '/auth/google',
  exact: true,
  external: true
}]

const schema = z.object({
  email: z.email('Adresa de email nu este valida'),
  password: z.string('Parola este obligatorie').min(1, 'Parola este obligatorie'),
  remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/login', {
      method: 'POST',
      body: { ...payload.data, turnstileToken: turnstileToken.value }
    })
    await fetch()
    await useCart().syncCart()
    toast.add({ title: 'Autentificare reusita', color: 'success' })
    await navigateTo('/')
  } catch (err: any) {
    turnstileToken.value = ''
    turnstile.value?.reset()
    toast.add({
      title: 'Autentificare esuata',
      description: err.data?.message || 'Datele introduse nu sunt valide',
      color: 'error'
    })
  }
}
</script>


<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Autentificare"
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        separator="sau"
        :submit="{ label: 'Autentificare' }"
        @submit="onSubmit"
      >
        <template #description>
          Nu ai cont? <ULink to="/user/register" class="text-primary font-medium">Inregistrare</ULink>.
        </template>
        <template #password-hint>
          <ULink to="/user/forgot-password" class="text-primary font-medium" tabindex="-1">Am uitat parola</ULink>
        </template>
      </UAuthForm>
    </UPageCard>
    <div class="flex justify-center mt-2">
      <NuxtTurnstile ref="turnstile" v-model="turnstileToken" />
    </div>
  </div>
</template>

