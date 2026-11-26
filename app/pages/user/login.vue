<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { safeRedirectPath } from '~~/shared/utils/redirect'
import { fetchFailure } from '~~/shared/utils/fetchFailure'

definePageMeta({
  middleware: 'guest'
})

const { fetch } = useUserSession()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const turnstileToken = ref('')
const turnstile = useTemplateRef('turnstile')

// The page that sent the visitor here (?redirect=, set by the route
// middleware), e.g. /checkout. Every way of signing in returns to it.
const redirectTo = safeRedirectPath(route.query.redirect)
const redirectQuery = redirectTo ? { redirect: redirectTo } : {}

// A failed Google sign-in redirects here with ?error=oauth_failed, or with
// ?error=oauth_unverified when Google itself reports that it hasn't confirmed
// the address of the Google account (email_verified: false). That is Google's
// own check, not the confirmation link this shop emails. Gmail addresses are
// always confirmed; it happens with a Google account made for another address.
const GOOGLE_ERRORS: Record<string, string> = {
  oauth_failed: 'Autentificarea cu Google nu a reusit. Incearca din nou.',
  oauth_unverified: 'Google nu a confirmat adresa de email a contului tau. Intra cu email si parola sau creeaza un cont.',
}

onMounted(() => {
  const description = GOOGLE_ERRORS[String(route.query.error)]
  if (!description) return
  toast.add({
    title: 'Autentificare esuata',
    description,
    color: 'error',
    // The default 2.5 s is too short to read this, and it can't be shown again:
    // it comes from a redirect.
    duration: 8000
  })
  const { error: _, ...query } = route.query
  router.replace({ query })
})

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
  to: redirectTo ? `/auth/google?redirect=${encodeURIComponent(redirectTo)}` : '/auth/google',
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
    await navigateTo(redirectTo ?? '/')
  } catch (err) {
    turnstileToken.value = ''
    turnstile.value?.reset()
    toast.add({
      title: 'Autentificare esuata',
      description: fetchFailure(err).message || 'Datele introduse nu sunt valide',
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
          Nu ai cont? <ULink :to="{ path: '/user/register', query: redirectQuery }" class="text-primary font-medium">Inregistrare</ULink>.
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

