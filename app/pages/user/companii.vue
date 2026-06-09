<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'account',
  middleware: ['authenticated']
})

const { data: userBillingAddresses, refresh: refreshBillingAddresses } = await useFetch('/api/user/billing-addresses')

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
  if (!confirm('Sigur doresti sa stergi aceasta companie?')) return
  await $fetch(`/api/user/billing-addresses/${id}`, { method: 'DELETE' })
  await refreshBillingAddresses()
  useToast().add({ title: 'Companie stearsa', color: 'success' })
}

async function handleBillingSaved() {
  await refreshBillingAddresses()
  isBillingModalOpen.value = false
}
</script>

<template>
  <div class="flex-1 flex flex-col">
    <UCard class="flex-1 flex flex-col overflow-hidden" :ui="{ root: 'rounded-md flex-1 flex flex-col', body: 'p-6 sm:p-8 flex-1 flex flex-col' }">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg sm:text-xl font-bold text-gray-900">Persoane Juridice</h3>
        <UButton @click="openAddBilling" color="primary" variant="subtle" icon="i-lucide-plus" class="rounded-sm px-2">Adauga</UButton>
      </div>

      <div v-if="userBillingAddresses?.length === 0" class="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-500 bg-gray-50 rounded-sm border border-dashed border-gray-200">
        Nici o companie salvata in cont.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="addr in userBillingAddresses" :key="addr.id" class="p-5 rounded-sm border border-gray-200 bg-white relative hover:border-gray-300 transition-all flex flex-col">
          <div class="mb-4">
            <p class="font-bold text-gray-900 inline">{{ addr.companyName }}</p>
            <p class="text-sm text-gray-600 inline ml-1">· {{ addr.hasRo ? 'RO' : '' }}{{ addr.cui }}</p>
            <p v-if="addr.onrc" class="text-sm text-gray-600 mt-1">Reg. Com.: {{ addr.onrc }}</p>
            <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.street }}</p>
            <p class="text-sm text-gray-600 line-clamp-2 mt-1">{{ addr.city }}, {{ addr.county }}</p>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
            <div class="flex gap-2 items-center">
              <UBadge v-if="addr.isDefaultBilling" color="neutral" variant="subtle" size="sm">Adresa implicita</UBadge>
            </div>
            <div class="flex gap-1">
              <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" class="font-medium" @click="openEditBilling(addr)" />
              <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" class="font-medium" @click="removeBilling(addr.id)" />
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UModal v-model:open="isBillingModalOpen" :title="billingModalMode === 'add' ? 'Adauga persoana juridica' : 'Editeaza persoana juridica'" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
        <BillingAddressForm
          :key="billingModalMode === 'edit' ? `edit-${currentBillingId}` : 'add'"
          :is-first-address="!userBillingAddresses || userBillingAddresses.length === 0"
          :address="billingModalMode === 'edit' ? currentBilling : null"
          @saved="handleBillingSaved"
        />
      </template>
    </UModal>
  </div>
</template>
