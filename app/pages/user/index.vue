<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['authenticated']
})

const { fetch: refreshSession } = useUserSession()

// Fetch full profile info
const { data: userProfile, refresh: refreshProfile } = await useFetch('/api/user')
const { data: userAddresses, refresh: refreshAddresses } = await useFetch('/api/user/addresses')
const { data: userBillingAddresses, refresh: refreshBillingAddresses } = await useFetch('/api/user/billing-addresses')
const isLoading = ref(false)

// Edit Profile Form State
const isProfileModalOpen = ref(false)
const editProfileForm = ref({
  firstName: userProfile.value?.firstName || '',
  lastName: userProfile.value?.lastName || ''
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

const isBillingModalOpen = ref(false)
const billingModalMode = ref<'add' | 'edit'>('add')
const currentBillingId = ref<number | null>(null)

function openAddBilling() {
  billingModalMode.value = 'add'
  currentBillingId.value = null
  isBillingModalOpen.value = true
}

function openEditBilling(addr: any) {
  billingModalMode.value = 'edit'
  currentBillingId.value = addr.id
  isBillingModalOpen.value = true
}

const currentBilling = computed(() => {
  return (userBillingAddresses.value as any[])?.find((a: any) => a.id === currentBillingId.value) || null
})

async function removeBilling(id: number) {
  if (!confirm('Sigur dorești să ștergi această companie?')) return
  await $fetch(`/api/user/billing-addresses/${id}`, { method: 'DELETE' })
  await refreshBillingAddresses()
  useToast().add({ title: 'Companie ștearsă', color: 'success' })
}

async function handleBillingSaved() {
  await refreshBillingAddresses()
  isBillingModalOpen.value = false
}

watchEffect(() => {
   if (userProfile.value) {
      editProfileForm.value.firstName = userProfile.value.firstName
      editProfileForm.value.lastName = userProfile.value.lastName
   }
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <h1 class="text-3xl lg:text-4xl font-bold mb-6">Detalii cont</h1>
    <UCard class="overflow-hidden" :ui="{ root: 'rounded-md', body: 'p-0 sm:p-0' }">
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

               <div>
                  <p class="font-bold text-gray-900 inline">{{ addr.firstName + ' ' + addr.lastName }}</p>
                  <p class="text-gray-500 text-sm inline ml-1" v-if="addr.phone">· {{ addr.phone.replace('+40', '0') }}</p>
                  <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.street }}</p>
                  <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.city }}, {{ addr.county }} <span v-if="addr.postalCode">({{ addr.postalCode }})</span></p>
               </div>
            </div>
         </div>
      </div>

      <!-- Billing Address Management Section -->
      <div class="p-6 sm:p-8 border-t border-gray-200">
         <div class="flex items-center justify-between mb-6">
           <h3 class="text-lg sm:text-xl font-bold text-gray-900">Persoane Juridice</h3>
           <UButton @click="openAddBilling" color="primary" variant="subtle" icon="i-lucide-plus" class="rounded-md px-2">Adaugă</UButton>
         </div>

         <div v-if="userBillingAddresses?.length === 0" class="text-center py-12 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200">
            Nici o companie salvată în cont.
         </div>

         <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="addr in userBillingAddresses" :key="addr.id" class="p-5 rounded-sm border border-gray-200 bg-white relative hover:border-gray-300 transition-all">
               
              <div class="flex items-center justify-between mb-2">
               <div class="flex gap-2 items-center">
                  <UBadge v-if="addr.isDefaultBilling" color="primary" size="xs">Facturare</UBadge>
               </div>
               <div class="flex gap-1">
                  <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" class="font-medium" @click="openEditBilling(addr)"><span class="hidden sm:hidden">Editează</span></UButton>
                  <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" class="font-medium" @click="removeBilling(addr.id)"></UButton>
               </div>
              </div>

               <div class="mb-4">
                  <p class="font-bold text-gray-900 inline">{{ addr.companyName }}</p>
                  <p class="text-sm text-gray-600 inline ml-1">· {{ addr.onrc }}</p>
                  <p class="text-sm text-gray-600 mt-1">CUI: {{ addr.hasRo ? 'RO ' : '' }}{{ addr.cui }}</p>
                  <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.street }}</p>
                  <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.city }}, {{ addr.county }}</p>
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

    <!-- Billing Form Modal -->
    <UModal v-model:open="isBillingModalOpen" :title="billingModalMode === 'add' ? 'Adaugă persoană juridică' : 'Editează persoană juridică'" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
      <BillingAddressForm 
        :is-first-address="!userBillingAddresses || userBillingAddresses.length === 0" 
        :address="billingModalMode === 'edit' ? currentBilling : null" 
        @saved="handleBillingSaved" 
      />
      </template>
    </UModal>

  </UContainer>
</template>
