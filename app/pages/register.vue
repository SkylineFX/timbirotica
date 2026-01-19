<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

const toast = useToast()

const fields: AuthFormField[] = [{
  name: 'name',
  type: 'text',
  label: 'Name',
  placeholder: 'Enter your name',
  required: true
}, {
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'passwordConfirm',
  label: 'Confirm Password',
  type: 'password',
  placeholder: 'Confirm your password',
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
  name: z.string('Name is required').min(3, 'Must be at least 3 characters'),
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters'),
  passwordConfirm: z.string('Password confirmation is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (payload.data.password !== payload.data.passwordConfirm) {
    toast.add({
      title: 'Passwords do not match',
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
        title="Register"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
    </UPageCard>
    <p class="text-sm text-center">
      Already have an account? <NuxtLink to="/login" class="text-primary-500 hover:underline">Login here</NuxtLink>
    </p>
  </div>
</template>

