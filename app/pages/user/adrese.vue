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

const toast = useToast()
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
  return (
    (userAddresses.value as Address[])?.find((a: Address) => a.id === currentAddressId.value) ||
    null
  )
})

async function removeAddress(id: number) {
  if (!confirm('Sigur doresti sa stergi aceasta adresa?')) return
  try {
    await $fetch(`/api/user/addresses/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Adresa stearsa', color: 'success' })
  } catch {
    toast.add({
      title: 'Eroare la stergerea adresei',
      description: 'Te rugam sa incerci din nou.',
      color: 'error'
    })
  }
  await refreshAddresses()
}

async function handleAddressSaved() {
  await refreshAddresses()
  isAddressModalOpen.value = false
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <UCard
      class="flex flex-1 flex-col overflow-hidden"
      :ui="{ root: 'rounded-md flex-1 flex flex-col', body: 'p-6 sm:p-8 flex-1 flex flex-col' }"
    >
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-900 sm:text-xl">Adresele mele</h3>
        <UButton
          color="primary"
          variant="subtle"
          icon="i-lucide-plus"
          class="rounded-sm px-2"
          @click="openAddAddress"
          >Adauga</UButton
        >
      </div>

      <div
        v-if="userAddresses?.length === 0"
        class="flex flex-1 flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500"
      >
        Nici o adresa salvata in cont.
      </div>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          v-for="addr in userAddresses"
          :key="addr.id"
          class="relative rounded-sm border border-gray-200 bg-white p-5 transition-all hover:border-gray-300"
        >
          <div class="mb-4">
            <span class="inline font-bold text-gray-900">{{
              addr.firstName + ' ' + addr.lastName
            }}</span>
            <span v-if="addr.phone" class="ml-1 inline text-sm text-gray-500"
              >· {{ addr.phone }}</span
            >
            <p class="mt-1 line-clamp-2 text-sm text-gray-600">{{ addr.street }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-gray-600">
              {{ addr.city }}, {{ addr.county }}
              <span v-if="addr.postalCode">({{ addr.postalCode }})</span>
            </p>
          </div>

          <div class="mt- flex items-center justify-between border-t border-gray-200 pt-4">
            <div class="flex items-center gap-2">
              <UBadge v-if="addr.isDefaultShipping" color="neutral" variant="subtle" size="sm"
                >Adresa implicita</UBadge
              >
            </div>
            <div class="flex gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-pencil"
                aria-label="Editeaza adresa"
                class="font-medium"
                @click="openEditAddress(addr)"
              />
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-lucide-trash-2"
                aria-label="Sterge adresa"
                class="font-medium"
                @click="removeAddress(addr.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="isAddressModalOpen"
      :title="modalMode === 'add' ? 'Adauga adresa noua' : 'Editeaza adresa'"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <AddressForm
          :address="modalMode === 'edit' ? currentAddress : null"
          @saved="handleAddressSaved"
        />
      </template>
    </UModal>
  </div>
</template>
