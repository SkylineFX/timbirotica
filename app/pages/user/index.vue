<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['authenticated']
})

const { user: sessionUser, fetch: refreshSession } = useUserSession()

// Fetch full profile info
const { data: userProfile, refresh: refreshProfile } = await useFetch('/api/user')
const { data: userAddresses, refresh: refreshAddresses } = await useFetch('/api/user/addresses')

const isLoading = ref(false)

// Edit Profile Form State
const isProfileModalOpen = ref(false)
const editProfileForm = ref({
  firstName: userProfile.value?.firstName || '',
  lastName: userProfile.value?.lastName || '',
  email: userProfile.value?.email || ''
})

async function saveProfile() {
  isLoading.value = true
  try {
    await $fetch('/api/user', {
      method: 'PUT',
      body: editProfileForm.value
    })
    await refreshProfile()
    await refreshSession()
    isProfileModalOpen.value = false
    useToast().add({ title: 'Profil actualizat cu succes', color: 'success' })
  } catch (err: any) {
    useToast().add({ title: 'Eroare la actualizarea profilului', description: err.message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}

type Address = {
  id: number
  firstName: string
  lastName: string
  phone: string
  county: string
  city: string
  street: string
  postalCode?: string | null
  isDefaultShipping: boolean | null
}

const isAddressModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const currentAddressId = ref<number | null>(null)

function openAddAddress() {
  modalMode.value = 'add'
  currentAddressId.value = null
  isAddressModalOpen.value = true
}

function openEditAddress(addr: Address) {
  modalMode.value = 'edit'
  currentAddressId.value = addr.id
  isAddressModalOpen.value = true
}

const currentAddress = computed(() => {
  return (userAddresses.value as Address[])?.find((a: Address) => a.id === currentAddressId.value) || null
})

async function removeAddress(id: number) {
  if (!confirm('Sigur doresti sa stergi aceasta adresa?')) return
  await $fetch(`/api/user/addresses/${id}`, { method: 'DELETE' })
  await refreshAddresses()
  useToast().add({ title: 'Adresa stearsa', color: 'success' })
}

async function handleAddressSaved() {
  await refreshAddresses()
  isAddressModalOpen.value = false
}

watchEffect(() => {
   if (userProfile.value) {
      editProfileForm.value.firstName = userProfile.value.firstName
      editProfileForm.value.lastName = userProfile.value.lastName
      editProfileForm.value.email = userProfile.value.email
   }
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <h1 class="text-3xl lg:text-4xl font-bold mb-6">Detalii cont</h1>
    <UCard class="overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
      <!-- User Profile Header Section -->
      <div class="bg-gray-50/50 p-6 sm:p-8 border-b border-gray-200 flex flex-row gap-6 items-start sm:items-center justify-between">
         <div class="flex items-center gap-5">
            <UAvatar :alt="userProfile?.firstName + ' ' + userProfile?.lastName" size="3xl" class="ring-2 ring-white shadow-sm" />
            <div>
              <h2 class="text-xl font-bold text-gray-900">{{ userProfile?.firstName }} {{ userProfile?.lastName }}</h2>
              <p class="text-gray-500">{{ userProfile?.email }}</p>
            </div>
         </div>
         <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" @click="isProfileModalOpen = true">
            <span class="hidden sm:block">Editează</span>
         </UButton>
      </div>

      <!-- Address Management Section -->
      <div class="p-6 sm:p-8">
         <div class="flex items-center justify-between mb-6">
           <h3 class="text-lg sm:text-xl font-bold text-gray-900">Adresele mele</h3>
           <UButton @click="openAddAddress" color="primary" variant="subtle" icon="i-lucide-plus" class="rounded-md px-2">Adaugă</UButton>
         </div>

         <div v-if="userAddresses?.length === 0" class="text-center py-12 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200">
            Nici o adresa salvata in cont.
         </div>

         <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="addr in userAddresses" :key="addr.id" class="p-5 rounded-sm border border-gray-200 bg-white relative hover:border-gray-300 transition-all">
               
              <div class="flex items-center justify-between mb-2">
               <div class="flex gap-2 items-center">
                  <UBadge v-if="addr.isDefaultShipping" color="primary" size="xs">Livrare</UBadge>
               </div>
               <div class="flex gap-1">
                  <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" class="font-medium" @click="openEditAddress(addr)"><span class="hidden sm:hidden">Editează</span></UButton>
                  <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" class="font-medium" @click="removeAddress(addr.id)"></UButton>
               </div>
              </div>

               <div class="mb-4 h-24">
                  <p class="font-bold text-gray-900">{{ addr.firstName + ' ' + addr.lastName }}</p>
                  <p class="text-sm text-gray-600 mt-1">{{ addr.phone }}</p>
                  <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.street }}</p>
                  <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.city }}, {{ addr.county }} <span v-if="addr.postalCode">({{ addr.postalCode }})</span></p>
               </div>
            </div>
         </div>
      </div>
    </UCard>

    <!-- Edit Profile Modal -->
    <UModal v-model:open="isProfileModalOpen" title="Editeaza Profilul" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <form @submit.prevent="saveProfile" class="space-y-6 px-2">
           <div class="grid grid-cols-2 gap-4">
              <UFormField label="Prenume" name="firstName">
                 <UInput v-model="editProfileForm.firstName" size="lg" class="w-full" required />
              </UFormField>
              <UFormField label="Nume" name="lastName">
                 <UInput v-model="editProfileForm.lastName" size="lg" class="w-full" required />
              </UFormField>
           </div>
           <UFormField label="Email" name="email">
              <UInput v-model="editProfileForm.email" size="lg" class="w-full" required />
           </UFormField>
           
           <div class="pt-4 pb-2">
              <UButton type="submit" color="primary" block size="xl" class="rounded-md font-semibold" :loading="isLoading">Salveaza Profilul</UButton>
           </div>
        </form>
      </template>
    </UModal>

    <!-- Address Form Modal -->
    <UModal v-model:open="isAddressModalOpen" :title="modalMode === 'add' ? 'Adauga adresa noua' : 'Editeaza adresa'" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
      <AddressForm 
        :is-first-address="!userAddresses || userAddresses.length === 0" 
        :address="modalMode === 'edit' ? currentAddress : null" 
        @saved="handleAddressSaved" 
      />
      </template>
    </UModal>

  </UContainer>
</template>
