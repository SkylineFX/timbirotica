<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

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

const { data: userAddresses, refresh: refreshAddresses } = await useFetch('/api/user/addresses')

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
</script>

<template>
  <div>
    <UCard class="overflow-hidden" :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
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
              <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" class="font-medium" @click="openEditAddress(addr)" />
              <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" class="font-medium" @click="removeAddress(addr.id)" />
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
    </UCard>

    <UModal v-model:open="isAddressModalOpen" :title="modalMode === 'add' ? 'Adauga adresa noua' : 'Editeaza adresa'" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
        <AddressForm
          :is-first-address="!userAddresses || userAddresses.length === 0"
          :address="modalMode === 'edit' ? currentAddress : null"
          @saved="handleAddressSaved"
        />
      </template>
    </UModal>
  </div>
</template>
