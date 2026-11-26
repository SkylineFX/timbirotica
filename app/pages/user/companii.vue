<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

const toast = useToast()
const { data: userBillingAddresses, refresh: refreshBillingAddresses } = await useFetch(
  '/api/user/billing-addresses'
)

const isBillingModalOpen = ref(false)
const billingModalMode = ref<'add' | 'edit'>('add')
const currentBillingId = ref<number | null>(null)

function openAddBilling() {
  billingModalMode.value = 'add'
  currentBillingId.value = null
  isBillingModalOpen.value = true
}

function openEditBilling(addr: { id: number }) {
  billingModalMode.value = 'edit'
  currentBillingId.value = addr.id
  isBillingModalOpen.value = true
}

const currentBilling = computed(() => {
  return userBillingAddresses.value?.find((a) => a.id === currentBillingId.value) || null
})

async function removeBilling(id: number) {
  if (!confirm('Sigur doresti sa stergi aceasta companie?')) return
  try {
    await $fetch(`/api/user/billing-addresses/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Companie stearsa', color: 'success' })
  } catch {
    toast.add({
      title: 'Eroare la stergerea companiei',
      description: 'Te rugam sa incerci din nou.',
      color: 'error'
    })
  }
  await refreshBillingAddresses()
}

async function handleBillingSaved() {
  await refreshBillingAddresses()
  isBillingModalOpen.value = false
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <UCard
      class="flex flex-1 flex-col overflow-hidden"
      :ui="{ root: 'rounded-md flex-1 flex flex-col', body: 'p-6 sm:p-8 flex-1 flex flex-col' }"
    >
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-900 sm:text-xl">Persoane Juridice</h3>
        <UButton
          color="primary"
          variant="subtle"
          icon="i-lucide-plus"
          class="rounded-sm px-2"
          @click="openAddBilling"
          >Adauga</UButton
        >
      </div>

      <div
        v-if="userBillingAddresses?.length === 0"
        class="flex flex-1 flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500"
      >
        Nici o companie salvata in cont.
      </div>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          v-for="addr in userBillingAddresses"
          :key="addr.id"
          class="relative flex flex-col rounded-sm border border-gray-200 bg-white p-5 transition-all hover:border-gray-300"
        >
          <div class="mb-4">
            <span class="inline font-bold text-gray-900">{{ addr.companyName }}</span>
            <span class="ml-1 inline text-sm text-gray-600"
              >· {{ addr.hasRo ? 'RO' : '' }}{{ addr.cui }}</span
            >
            <p v-if="addr.onrc" class="mt-1 text-sm text-gray-600">Reg. Com.: {{ addr.onrc }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-gray-600">{{ addr.street }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-gray-600">
              {{ addr.city }}, {{ addr.county }}
            </p>
          </div>

          <div class="mt-auto flex items-center justify-between border-t border-gray-200 pt-4">
            <div class="flex items-center gap-2">
              <UBadge v-if="addr.isDefaultBilling" color="neutral" variant="subtle" size="sm"
                >Adresa implicita</UBadge
              >
            </div>
            <div class="flex gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-pencil"
                aria-label="Editeaza compania"
                class="font-medium"
                @click="openEditBilling(addr)"
              />
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-lucide-trash-2"
                aria-label="Sterge compania"
                class="font-medium"
                @click="removeBilling(addr.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="isBillingModalOpen"
      :title="
        billingModalMode === 'add' ? 'Adauga persoana juridica' : 'Editeaza persoana juridica'
      "
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <BillingAddressForm
          :key="billingModalMode === 'edit' ? `edit-${currentBillingId}` : 'add'"
          :address="billingModalMode === 'edit' ? currentBilling : null"
          @saved="handleBillingSaved"
        />
      </template>
    </UModal>
  </div>
</template>
