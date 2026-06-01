<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest'
})

const toast = useToast()

const fields: AuthFormField[] = [{
  name: 'firstName',
  type: 'text',
  label: 'Prenume',
  placeholder: 'Introduceti prenumele',
  required: true
}, {
  name: 'lastName',
  type: 'text',
  label: 'Nume',
  placeholder: 'Introduceti numele',
  required: true
}, {
  name: 'phone',
  type: 'text',
  label: 'Numar de telefon',
  placeholder: '07xxxxxxxx',
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
  to: '/auth/google',
  exact: true,
  external: true
}]

const schema = z.object({
  firstName: z.string('Prenumele este obligatoriu').min(2, 'Prenumele prea scurt'),
  lastName: z.string('Numele este obligatoriu').min(2, 'Numele prea scurt'),
  phone: z.string('Numarul de telefon este obligatoriu').regex(/^0\d{3}\s?\d{3}\s?\d{3}$/, 'Numar de telefon invalid'),
  email: z.email('Adresa de email nu este valida'),
  password: z.string('Parola este obligatorie').min(10, 'Parola trebuie sa aiba cel putin 10 caractere'),
  passwordConfirm: z.string('Confirmarea parolei este obligatorie')
}).refine(data => data.password === data.passwordConfirm, {
  message: 'Parolele nu sunt identice',
  path: ['passwordConfirm']
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/register', {
      method: 'POST',
      body: {
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        phone: payload.data.phone.replace(/\s+/g, ''),
        email: payload.data.email,
        password: payload.data.password,
      },
    })
    toast.add({
      title: 'Inregistrare reusita',
      color: 'success',
    })
    const { fetch } = useUserSession()
    await fetch()
    await navigateTo('/')
  } catch (err: any) {
    toast.add({
      title: 'Inregistrare esuata',
      description: err.data?.message || 'Eroare la inregistrare.',
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
        separator="sau"
        :submit="{ label: 'Creeaza cont' }"
        :ui="{ form: 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 space-y-0 sm:[&>*]:col-span-2 sm:[&>*:nth-child(1)]:col-span-1 sm:[&>*:nth-child(2)]:col-span-1' }"
        @submit="onSubmit"
      >
        <template #description>
          Ai deja un cont? <ULink to="/user/login" class="text-primary font-medium">Autentificare</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

