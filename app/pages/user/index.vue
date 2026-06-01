<script setup lang="ts">
import { ref, computed } from 'vue'
import { vMaska } from 'maska/vue'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

const { fetch: refreshSession } = useUserSession()
const toast = useToast()

const { data: userProfile, refresh: refreshProfile } = await useFetch('/api/user')
const isLoading = ref(false)

const form = ref({
  firstName: userProfile.value?.firstName || '',
  lastName: userProfile.value?.lastName || '',
  phone: userProfile.value?.phone || ''
})

watchEffect(() => {
  if (userProfile.value) {
    form.value.firstName = userProfile.value.firstName
    form.value.lastName = userProfile.value.lastName
    form.value.phone = userProfile.value.phone || ''
  }
})

const isDirty = computed(() =>
  form.value.firstName !== (userProfile.value?.firstName ?? '') ||
  form.value.lastName !== (userProfile.value?.lastName ?? '') ||
  form.value.phone.replace(/\s+/g, '') !== (userProfile.value?.phone ?? '')
)

const fullName = computed(() =>
  `${userProfile.value?.firstName ?? ''} ${userProfile.value?.lastName ?? ''}`.trim()
)

async function saveProfile() {
  if (!isDirty.value) return
  const firstName = form.value.firstName.trim()
  const lastName = form.value.lastName.trim()
  if (firstName.length < 2) {
    toast.add({ title: 'Prenume prea scurt', description: 'Prenumele trebuie sa aiba cel putin 2 caractere', color: 'error' })
    return
  }
  if (lastName.length < 2) {
    toast.add({ title: 'Nume prea scurt', description: 'Numele trebuie sa aiba cel putin 2 caractere', color: 'error' })
    return
  }
  const phone = form.value.phone.replace(/\s+/g, '')
  if (phone && !/^0\d{9}$/.test(phone)) {
    toast.add({ title: 'Numar de telefon invalid', color: 'error' })
    return
  }
  isLoading.value = true
  try {
    await $fetch('/api/user', {
      method: 'PUT',
      body: { firstName, lastName, phone }
    })
    await refreshProfile()
    await refreshSession()
    toast.add({ title: 'Profil actualizat cu succes', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Eroare la actualizarea profilului', description: err?.data?.message || 'Te rugam sa incerci din nou.', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

// === Password change ===
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref<string | null>(null)
const isPasswordSaving = ref(false)

const passwordDirty = computed(() =>
  !!passwordForm.value.currentPassword || !!passwordForm.value.newPassword || !!passwordForm.value.confirmPassword
)

async function savePassword() {
  passwordError.value = null

  if (!passwordForm.value.currentPassword) {
    passwordError.value = 'Introdu parola curenta.'
    return
  }
  if (passwordForm.value.newPassword.length < 10) {
    passwordError.value = 'Parola noua trebuie sa aiba cel putin 10 caractere.'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Parolele noi nu coincid.'
    return
  }
  if (passwordForm.value.newPassword === passwordForm.value.currentPassword) {
    passwordError.value = 'Noua parola nu poate fi identica cu cea curenta.'
    return
  }

  isPasswordSaving.value = true
  try {
    await $fetch('/api/user/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }
    })
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    toast.add({ title: 'Parola a fost actualizata', color: 'success' })
  } catch (err: any) {
    passwordError.value = err?.data?.message || 'Nu am putut actualiza parola.'
  } finally {
    isPasswordSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <UCard class="overflow-hidden" :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="flex items-center gap-5 pb-6 border-b border-gray-100 mb-6">
        <UAvatar :alt="fullName || 'Cont'" size="3xl" class="ring-2 ring-white shadow-sm" />
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ fullName }}</h2>
          <p class="text-gray-500 text-sm">{{ userProfile?.email }}</p>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-6">
        <UFormField label="Numar de telefon" name="phone">
          <UInput v-model="form.phone" v-maska="'#### ### ###'" type="tel" autocomplete="tel" size="lg" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Prenume" name="firstName">
            <UInput v-model="form.firstName" size="lg" class="w-full" required />
          </UFormField>
          <UFormField label="Nume" name="lastName">
            <UInput v-model="form.lastName" size="lg" class="w-full" required />
          </UFormField>
        </div>

        <div class="flex justify-end pt-2">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            class="rounded-md font-semibold"
            :loading="isLoading"
            :disabled="!isDirty || isLoading"
          >
            Salveaza
          </UButton>
        </div>
      </form>
    </UCard>

    <UCard class="overflow-hidden" :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="mb-6">
        <h3 class="text-lg font-bold text-gray-900">Schimba parola</h3>
        <p class="text-sm text-gray-500 mt-1">Introdu parola curenta, apoi alege una noua cu cel putin 10 caractere.</p>
      </div>

      <form @submit.prevent="savePassword" class="space-y-6">
        <UFormField label="Parola curenta" name="currentPassword">
          <UInput v-model="passwordForm.currentPassword" type="password" size="lg" class="w-full" autocomplete="current-password" required />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Parola noua" name="newPassword">
            <UInput v-model="passwordForm.newPassword" type="password" size="lg" class="w-full" autocomplete="new-password" required />
          </UFormField>
          <UFormField label="Confirmare parola noua" name="confirmPassword">
            <UInput v-model="passwordForm.confirmPassword" type="password" size="lg" class="w-full" autocomplete="new-password" required />
          </UFormField>
        </div>

        <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>

        <div class="flex justify-end pt-2">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            class="rounded-md font-semibold"
            :loading="isPasswordSaving"
            :disabled="!passwordDirty || isPasswordSaving"
          >
            Actualizeaza parola
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
