<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

const toast = useToast()

const fields: AuthFormField[] = [{
  name: 'name',
  type: 'text',
  label: 'Nume',
  placeholder: 'Introduceti numele dumneavoastra',
  required: true
}, {
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
  name: 'passwordConfirm',
  label: 'Confirmare parola',
  type: 'password',
  placeholder: 'Confirmati parola',
  required: true
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Login with Google' })
  }
}]

const schema = z.object({
  name: z.string('Numele este obligatoriu').min(2, 'Numele trebuie sa aiba cel putin 2 caractere'),
  email: z.email('Adresa de email nu este valida'),
  password: z.string('Parola este obligatorie').min(8, 'Parola trebuie sa aiba cel putin 8 caractere'),
  passwordConfirm: z.string('Confirmarea parolei este obligatorie').min(8, 'Parola trebuie sa aiba cel putin 8 caractere')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (payload.data.password !== payload.data.passwordConfirm) {
    toast.add({
      title: 'Parolele nu sunt identice',
      color: 'error',
    })
    return
  }

  try {
    await $fetch('/api/register', {
      method: 'POST',
      body: {
        name: payload.data.name,
        email: payload.data.email,
        password: payload.data.password,
      },
    })
    toast.add({
      title: 'Registration successful',
      description: 'You have been logged in.',
      color: 'success',
    })
    const { fetch } = useUserSession()
    await fetch()
    await navigateTo('/')
  } catch (err: any) {
    toast.add({
      title: 'Registration failed',
      description: err.data?.message || 'Something went wrong',
      color: 'error',
    })
  }

}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Inregistrare"
        description="Introduceti datele dumneavoastra pentru a va putea crea contul."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      >
        <template #description>
          Ai deja un cont? <ULink to="/login" class="text-primary font-medium">Autentificare</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

