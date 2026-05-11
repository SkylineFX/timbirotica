<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

const { fetch: refreshSession } = useUserSession()

const { data: userProfile, refresh: refreshProfile } = await useFetch('/api/user')
const isLoading = ref(false)

const form = ref({
  firstName: userProfile.value?.firstName || '',
  lastName: userProfile.value?.lastName || ''
})

watchEffect(() => {
  if (userProfile.value) {
    form.value.firstName = userProfile.value.firstName
    form.value.lastName = userProfile.value.lastName
  }
})

const isDirty = computed(() =>
  form.value.firstName !== (userProfile.value?.firstName ?? '') ||
  form.value.lastName !== (userProfile.value?.lastName ?? '')
)

const fullName = computed(() =>
  `${userProfile.value?.firstName ?? ''} ${userProfile.value?.lastName ?? ''}`.trim()
)

async function saveProfile() {
  if (!isDirty.value) return
  isLoading.value = true
  try {
    await $fetch('/api/user', {
      method: 'PUT',
      body: form.value
    })
    await refreshProfile()
    await refreshSession()
    useToast().add({ title: 'Profil actualizat cu succes', color: 'success' })
  } catch (err: any) {
    useToast().add({ title: 'Eroare la actualizarea profilului', description: err.message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard class="overflow-hidden" :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
    <div class="flex items-center gap-5 pb-6 border-b border-gray-100 mb-6">
      <UAvatar :alt="fullName || 'Cont'" size="3xl" class="ring-2 ring-white shadow-sm" />
      <div>
        <h2 class="text-xl font-bold text-gray-900">{{ fullName }}</h2>
        <p class="text-gray-500 text-sm">{{ userProfile?.email }}</p>
      </div>
    </div>

    <form @submit.prevent="saveProfile" class="space-y-6">
      <UFormField label="Email" name="email" help="Email-ul nu poate fi modificat.">
        <UInput :model-value="userProfile?.email" disabled size="lg" class="w-full" />
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
          Salvează
        </UButton>
      </div>
    </form>
  </UCard>
</template>
