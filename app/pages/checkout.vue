<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'

definePageMeta({
  middleware: ['authenticated'],
})

const deliveryMethod = ref('courier') // 'courier' or 'pickup'

type Address = {
  id: number
  fullName: string
  phone: string
  county: string
  city: string
  street: string
  isDefaultShipping: boolean
  isDefaultBilling: boolean
}

const { data: userAddresses, refresh: refreshAddresses } = await useFetch<Address[]>('/api/user/addresses')

const selectedAddressId = ref<number | null>(null)

watchEffect(() => {
  const addresses = userAddresses.value
  if (addresses && addresses.length > 0 && !selectedAddressId.value) {
    const def = addresses.find(a => a.isDefaultShipping)
    selectedAddressId.value = def ? def.id : (addresses[0]?.id || null)
  }
})

const selectedAddress = computed(() => {
  return (userAddresses.value || []).find(a => a.id === selectedAddressId.value) || null
})

// Modals State
const isAddressModalOpen = ref(false)
const isNewAddressModalOpen = ref(false)

// Form State
const newAddress = ref({
  fullName: '',
  phone: '',
  county: 'București',
  city: '',
  street: '',
  postalCode: ''
})

const counties = ['București']
const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6']

async function saveNewAddress() {
  await $fetch('/api/user/addresses', {
    method: 'POST',
    body: newAddress.value
  })
  await refreshAddresses()
  isNewAddressModalOpen.value = false
  isAddressModalOpen.value = true
  
  newAddress.value = { fullName: '', phone: '', county: 'București', city: '', street: '', postalCode: '' } // reset form
}

function openNewAddress() {
  isAddressModalOpen.value = false
  isNewAddressModalOpen.value = true
}

function selectAddress(id: number) {
   selectedAddressId.value = id
   isAddressModalOpen.value = false
}
</script>

<template>
  <UContainer class="py-8 max-w-5xl">
    <div class="flex flex-col gap-8">
      
      <!-- Checkout Main Sections (Left Side) -->
      <div class="flex-1 space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-2xl font-bold">Detalii comanda</h1>
          <div class="flex items-center gap-2 border border-green-200 bg-white px-3 py-1.5 rounded-md">
             <UIcon name="i-lucide-lock" class="text-green-600 w-4 h-4" />
             <div class="flex flex-col text-[10px] leading-tight font-medium text-gray-700 uppercase">
                <span>Conexiune</span>
                <span>Securizata</span>
             </div>
          </div>
        </div>

        <!-- Section 1: Modalitate livrare -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          <!-- Step Header -->
          <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
            <div class="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold">1</div>
            <h2 class="text-lg font-semibold text-gray-900">Modalitate livrare</h2>
          </div>

          <div class="p-6">
            <!-- Tabs (Radio-like toggle) -->
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
              
              <!-- Courier Tab -->
              <div 
                @click="deliveryMethod = 'courier'"
                class="flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                :class="deliveryMethod === 'courier' ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" :class="deliveryMethod === 'courier' ? 'border-primary-500' : 'border-gray-300'">
                   <div v-if="deliveryMethod === 'courier'" class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                </div>
                <span class="font-medium text-gray-900">Livrare prin curier</span>
              </div>

              <!-- Pickup Tab -->
              <div 
                @click="deliveryMethod = 'pickup'"
                class="flex-1 flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors"
                :class="deliveryMethod === 'pickup' ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" :class="deliveryMethod === 'pickup' ? 'border-primary-500' : 'border-gray-300'">
                    <div v-if="deliveryMethod === 'pickup'" class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                  </div>
                  <span class="font-medium text-gray-900">Ridicare personala</span>
                </div>
                <UIcon name="i-lucide-info" class="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <!-- Courier Details Content -->
            <div v-if="deliveryMethod === 'courier'" class="space-y-4">
              
              <h3 class="text-lg font-medium text-gray-900 mb-2">Livrare prin curier la:</h3>
              
              <div class="flex items-start gap-4">
                <!-- Location Icon -->
                <div class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-white" />
                </div>
                
                <!-- Address Details -->
                <div class="flex-1">
                  <div v-if="selectedAddress">
                     <p class="font-medium text-gray-900 text-lg">{{ selectedAddress.fullName }} - {{ selectedAddress.phone }}</p>
                     <p class="text-gray-600 mt-1">{{ selectedAddress.street }}, {{ selectedAddress.city }} ({{ selectedAddress.county }})</p>
                  </div>
                  <div v-else>
                     <p class="font-medium text-gray-600 py-2">Nicio adresă de livrare nu a fost găsită. Vă rugăm să adăugați una.</p>
                  </div>
                  
                  <div class="mt-4">
                    <UButton variant="outline" color="neutral" class="rounded-full px-4 text-sm font-medium" @click="isAddressModalOpen = true">
                      Alege altă adresă
                    </UButton>
                  </div>
                </div>
              </div>

              <!-- Cost Box -->
              <div class="mt-6 bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-100">
                <UIcon name="i-lucide-package" class="w-6 h-6 text-gray-500" />
                <span class="font-medium text-gray-900">Cost livrare: <span class="font-bold">20<sup class="text-[10px] items-start ml-0.5 relative -top-1">00</sup> Lei</span></span>
              </div>

            </div>

            <!-- Pickup Details Content -->
            <div v-else-if="deliveryMethod === 'pickup'" class="space-y-4">
              <p class="text-gray-500 text-sm">Selecteaza locatia de ridicare...</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  </UContainer>

    <!-- Modals -->

    <!-- Address Selection Modal -->
    <UModal v-model:open="isAddressModalOpen" title="Alege adresa de livrare" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
         <div class="px-2">
          <div class="border border-gray-100 shadow-sm rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <span class="font-medium text-gray-900">Selecteaza o adresa din lista de mai jos sau adauga una noua.</span>
             <UButton color="primary" variant="outline" class="rounded-lg font-medium bg-white px-4" @click="openNewAddress">+ Adauga adresa noua</UButton>
          </div>

          <div class="space-y-4">
             <div v-if="userAddresses?.length === 0" class="text-center py-6 text-gray-500">
                Nu ai nicio adresa salvata in cont.
             </div>

             <div v-for="addr in userAddresses" :key="addr.id" class="flex items-start gap-4 p-5 rounded-xl border transition-colors cursor-pointer" :class="selectedAddressId === addr.id ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'" @click="selectAddress(addr.id)">
                <div class="mt-1 flex-shrink-0 w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-colors" :class="selectedAddressId === addr.id ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300'">
                   <UIcon v-if="selectedAddressId === addr.id" name="i-lucide-check" class="w-4 h-4" />
                </div>
                <div class="flex-1">
                   <div class="flex justify-between items-start">
                      <p class="font-bold text-gray-900 text-base">{{ addr.fullName }} - {{ addr.phone }}</p>
                      <UButton color="neutral" variant="outline" class="rounded-lg text-sm px-3 py-1 bg-white border-gray-300 text-gray-700" size="xs">editează</UButton>
                   </div>
                   <p class="text-gray-600 mt-2 pr-12">{{ addr.street }}, {{ addr.city }} ({{ addr.county }})</p>
                </div>
             </div>
          </div>
         </div>
      </template>
    </UModal>

    <!-- New Address Form Modal -->
    <UModal v-model:open="isNewAddressModalOpen" title="Adauga adresa noua" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
        <form @submit.prevent="saveNewAddress" class="space-y-6 px-2">
            <div>
              <h4 class="font-bold text-gray-900 mb-4 text-sm mt-2">Persoana de contact</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Nume" name="fullName">
                   <UInput v-model="newAddress.fullName" placeholder="ex: Popescu Alexandru" required size="lg" class="w-full" />
                </UFormField>
                <UFormField label="Numar de telefon" name="phone">
                   <UInput v-model="newAddress.phone" placeholder="07xxxxxxxx" required size="lg" class="w-full" />
                </UFormField>
              </div>
            </div>

            <div>
               <h4 class="font-bold text-gray-900 mb-4 text-sm mt-4">Adresa de livrare</h4>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <UFormField label="Judet" name="county">
                     <USelectMenu v-model="newAddress.county" :items="counties" placeholder="Selectati" required size="lg" class="w-full" />
                  </UFormField>
                  <UFormField label="Localitate" name="city">
                     <USelectMenu v-model="newAddress.city" :items="sectors" placeholder="Selectează sectorul" required size="lg" class="w-full" />
                  </UFormField>
               </div>
               <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                  <UFormField label="Adresa" name="street">
                     <UInput v-model="newAddress.street" placeholder="Strada, numar, bloc..." required size="lg" class="w-full" />
                  </UFormField>
                  <UFormField label="Cod Postal" name="postalCode">
                     <UInput v-model="newAddress.postalCode" size="lg" class="w-full" />
                  </UFormField>
               </div>
            </div>

            <div class="pt-4 pb-2">
               <UButton type="submit" color="primary" block size="xl" class="rounded-full font-semibold"> Salveaza </UButton>
            </div>
          </form>
      </template>
    </UModal>
</template>