<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useCart } from '~/composables/useCart'

definePageMeta({
  middleware: ['authenticated'],
})

// Cart integration
const { cartItems, total, fetchCart, removeFromCart, updateQuantity } = useCart()

// Fetch cart on mount if not already populated (helpful if refreshing)
if (import.meta.client) {
   fetchCart()
}

type Address = {
  id: number
  firstName: string
  lastName: string
  phone: string
  county: string
  city: string
  street: string
  postalCode?: string
  isDefaultShipping: boolean
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

// State for sections
const deliveryMethod = ref('courier') // 'courier' or 'pickup'
const paymentMethod = ref('transfer') // 'transfer' or 'cash'
const billingSameAsShipping = ref(true)

// Modals State
const isAddressModalOpen = ref(false)
const isNewAddressModalOpen = ref(false)

async function handleAddressSaved() {
  const oldIds = new Set((userAddresses.value || []).map(a => a.id))
  await refreshAddresses()
  
  const newAddr = (userAddresses.value || []).find(a => !oldIds.has(a.id))
  if (newAddr) {
    selectedAddressId.value = newAddr.id
  }
  
  isNewAddressModalOpen.value = false
  isAddressModalOpen.value = false
}

function openNewAddress() {
  isAddressModalOpen.value = false
  isNewAddressModalOpen.value = true
}

function selectAddress(id: number) {
   selectedAddressId.value = id
   isAddressModalOpen.value = false
}

// Payment mock data
const cardDetails = ref({
  number: '',
  expiry: '',
  cvv: '',
  name: ''
})

const subscribeNews = ref(false)

// Computed totals
const orderSummaryShippingCost = computed(() => {
  return deliveryMethod.value === 'courier' ? 20 : 0
})

const finalTotal = computed(() => {
  return total.value + orderSummaryShippingCost.value
})
</script>

<template>
  <div class="min-h-screen border-t border-gray-100 flex justify-center pb-20">
    <!-- Form + Summary Container -->
    <div class="w-full max-w-6xl flex flex-col lg:flex-row">
      
      <!-- Left Column (Checkout Form) -->
      <div class="w-full lg:w-3/5 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col gap-8 bg-white border-r border-gray-100">

        <!-- Logo / Title -->
        <div class="mb-4">
           <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">Finalizare comandă</h1>
           <p class="text-gray-500 mt-1">Completeaza detaliile de mai jos.</p>
        </div>

        <!-- 1. Ship to -->
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700">
            <span>Adresă de livrare</span>
            <button @click="isAddressModalOpen = true" class="text-blue-600 hover:text-blue-700 transition">
               <UIcon name="i-lucide-chevron-down" class="w-4 h-4 ml-1 inline align-middle"/>
            </button>
          </div>
          <div 
            class="text-sm text-gray-900 leading-relaxed border border-gray-200 rounded-md p-4 cursor-pointer hover:border-gray-300 transition-colors bg-white flex justify-between items-center" 
            @click="isAddressModalOpen = true"
          >
            <div>
               <template v-if="selectedAddress">
                 <span class="font-bold block mb-0.5">{{ selectedAddress.firstName }} {{ selectedAddress.lastName }}</span>
                 <span class="text-gray-600 block sm:inline">{{ selectedAddress.street }}, {{ selectedAddress.city }}, {{ selectedAddress.county }}</span> <span class="text-gray-500 block sm:inline mt-1 sm:mt-0 sm:ml-2">· {{ selectedAddress.phone }}</span>
               </template>
               <template v-else>
                 <span class="text-gray-500">Alege o adresă de livrare...</span>
               </template>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400 opacity-50 shrink-0" />
          </div>
        </div>

        <!-- 2. Shipping method -->
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700">
            <span>Metodă de livrare</span>
          </div>
          <div class="border border-gray-200 rounded-md overflow-hidden">
            <!-- Courier Option -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white transition-colors border-b border-gray-200" :class="{'bg-gray-50/50': deliveryMethod === 'courier'}">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="deliveryMethod === 'courier' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="deliveryMethod === 'courier'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <div>
                   <div class="font-semibold text-gray-900 text-sm">Livrare prin Curier</div>
                   <div class="text-gray-500 text-xs mt-0.5">Cu masinile noastre, doar in Bucuresti.</div>
                </div>
              </div>
              <div class="text-sm font-semibold text-gray-900">20.00 Lei</div>
              <input type="radio" value="courier" v-model="deliveryMethod" class="hidden">
            </label>

            <div v-show="deliveryMethod === 'courier'" class="p-5 bg-gray-50 border-b border-gray-200 space-y-4">
               <div class="text-sm text-gray-600 text-center flex flex-col items-center gap-2">
                <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" />
                <p class="text-sm text-gray-600"> Livrarea se face in 2-5 zile lucratoare de la primirea facturii pe mail si dupa ce comanda a fost confirmata telefonic.</p>
               </div>
            </div>

            <!-- Pickup Option -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white transition-colors" :class="{'bg-gray-50/50': deliveryMethod === 'pickup'}">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="deliveryMethod === 'pickup' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="deliveryMethod === 'pickup'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <div>
                   <div class="font-semibold text-gray-900 text-sm">Ridicare Personala</div>
                   <div class="text-gray-500 text-xs mt-0.5">De la sediul nostru</div>
                </div>
              </div>
              <div class="text-sm font-semibold text-gray-900">Gratuit</div>
              <input type="radio" value="pickup" v-model="deliveryMethod" class="hidden">
            </label>


            <div v-show="deliveryMethod === 'pickup'" class="p-5 bg-gray-50 border-t border-gray-200 text-center flex flex-col items-center gap-2">
               <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" />
               <p class="text-sm text-gray-600">Strada Drumul Taberei Nr. 92, Sector 6, București</p>
               <p class="text-sm text-gray-600">Te vom anunța pe email când comanda ta este gata de ridicare.</p>
            </div>
          </div>
        </div>

        <!-- 3. Payment block -->
        <div class="flex flex-col gap-3 mt-2">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Plată</h3>
            <!-- <p class="text-sm text-gray-500 mt-1">Toate tranzacțiile sunt securizate și criptate.</p> -->
          </div>
          <div class="border border-gray-200 rounded-md overflow-hidden mt-1">
            <!-- Bank Transfer -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white transition-colors border-b border-gray-200"
                   :class="{ 'bg-blue-50/10': paymentMethod === 'transfer' }">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="paymentMethod === 'transfer' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="paymentMethod === 'transfer'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900">Transfer bancar</span>
              </div>
              <div class="flex items-center gap-2">
                 <UIcon name="i-lucide-building-2" class="w-6 h-6 text-gray-400" />
              </div>
              <input type="radio" value="transfer" v-model="paymentMethod" class="hidden">
            </label>
            
            <!-- Bank transfer info -->
            <div v-show="paymentMethod === 'transfer'" class="p-5 bg-gray-50 border-b border-gray-200 space-y-4">
               <div class="text-sm text-gray-600 text-center flex flex-col items-center gap-2">
                 <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" />
                 <p>Efectuează plata direct în contul nostru bancar prin virament bancar dupa primirea facturii pe mail. Te rugăm să specifici numărul comenzii la detalii de plată.</p>
               </div>
            </div>

            <!-- Cash on Delivery Option -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white transition-colors"
                   :class="{ 'bg-blue-50/10': paymentMethod === 'cash' }">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="paymentMethod === 'cash'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900">Ramburs la curier (Numerar)</span>
              </div>
              <!-- Money icon -->
              <UIcon name="i-lucide-banknote" class="w-6 h-6 text-gray-400"></UIcon>
              <input type="radio" value="cash" v-model="paymentMethod" class="hidden">
            </label>
            
            <div v-show="paymentMethod === 'cash'" class="p-5 bg-gray-50 border-t border-gray-200 text-center flex flex-col items-center gap-2">
               <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" />
               <p class="text-sm text-gray-600">Plata se va face în numerar către curierul care livrează coletul. Dupa primirea facturii pe mail, agentul nostru te va contacta pentru confirmare si pentru stabilirea datei livrarii.</p>
            </div>
          </div>
        </div>

        <!-- 4. Billing Address block -->
        <div class="flex flex-col gap-3 mt-4"> 
          <div>
            <h3 class="text-xl font-bold text-gray-900">Facturare</h3>
          </div>
          <div class="border border-gray-200 rounded-md overflow-hidden divide-y divide-gray-200 mt-1">
            <label class="p-4 flex items-center gap-4 cursor-pointer bg-white hover:bg-gray-50" :class="{ 'bg-blue-50/10 hover:bg-blue-50/20': billingSameAsShipping }">
              <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="billingSameAsShipping ? 'border-primary' : 'border-gray-300'">
                <div v-if="billingSameAsShipping" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
              </div>
              <span class="text-sm font-medium text-gray-900">Aceeași cu adresa de livrare</span>
              <input type="radio" :value="true" v-model="billingSameAsShipping" class="hidden">
            </label>
            <label class="p-4 flex items-center gap-4 cursor-pointer bg-white hover:bg-gray-50" :class="{ 'bg-blue-50/10 hover:bg-blue-50/20': !billingSameAsShipping }">
              <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="!billingSameAsShipping ? 'border-primary' : 'border-gray-300'">
                <div v-if="!billingSameAsShipping" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
              </div>
              <span class="text-sm font-medium text-gray-900">Folosește altă adresă de facturare</span>
              <input type="radio" :value="false" v-model="billingSameAsShipping" class="hidden">
            </label>
            <div v-if="!billingSameAsShipping" class="p-6 bg-gray-50 flex justify-center text-center">
               <span class="text-sm text-gray-500">Formularul pentru o altă adresă de facturare s-ar afișa aici.</span>
            </div>
          </div>
        </div>

        <!-- Extra / Submit -->
        <div class="mt-6">
           <button class="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-md shadow-lg transition-transform active:scale-[0.98] hidden lg:block">
              Plasează comanda
           </button>
        </div>
      </div>

      <!-- Right Column (Order Summary) -->
      <div class="w-full lg:w-2/5 bg-gray-50/50 p-6 lg:p-12 lg:pl-10 border-b lg:border-b-0 lg:border-l border-gray-200 flex flex-col gap-6">
        <!-- Summary -->
        <div>
          <h3 class="text-xl font-bold text-gray-900">Sumar comanda</h3>
        </div>
         <!-- Items -->
         <div class="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-2">
            <!-- Empty state -->
            <div v-if="!cartItems.length" class="text-center text-gray-500 py-10">
               Cosul tau este gol.
            </div>

            <CartItem v-for="item in cartItems" :key="item.id" :item="item" variant="checkout" />
         </div>

         <!-- Totals -->
         <div class="pt-6 space-y-3 mt-2 border-t border-gray-200">
            <div class="flex justify-between items-center text-[15px] text-gray-600">
              <span>Subtotal</span>
              <span class="font-bold text-gray-800">{{ total.toFixed(2) }} RON</span>
            </div>
            <div class="flex justify-between items-center text-[15px] text-gray-600">
              <span class="flex items-center gap-1">
                Livrare 
                <a class="cursor-pointer flex items-center" href="/termeni-si-conditii#livrare-si-retur" @click.prevent="navigateTo('/termeni-si-conditii#livrare-si-retur')">
                  <UIcon name="i-lucide-help-circle" class="w-3.5 h-3.5 text-gray-400 hover:text-primary transition-colors"/>
                </a>
              </span>
              <span class="font-bold text-gray-800 tracking-tight">{{ orderSummaryShippingCost.toFixed(2) }} RON</span>
            </div>
         </div>

         <!-- Final Total -->
         <div class="pt-6 flex justify-between items-end mt-4 border-t border-gray-300 border-dashed">
            <div class="flex flex-col">
               <span class="text-xl font-extrabold text-gray-900">Total</span>
               <span class="text-xs text-gray-500 mt-0.5" v-if="finalTotal > 0">Include TVA de {{ (finalTotal * 0.21).toFixed(2) }} RON</span>
            </div>
            <div class="flex items-end gap-2 mb-0.5">
               <span class="text-2xl sm:text-3xl leading-none tracking-tight font-extrabold text-gray-900">{{ finalTotal.toFixed(2) }} RON</span>
            </div>
         </div>

        <div class="mt-6">
           <button class="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-md shadow-lg transition-transform active:scale-[0.98] lg:hidden">
              Plasează comanda
           </button>
        </div>
      </div>

    </div>
  </div>

  <!-- Modals remain the same functionally, only minor classes to match the new border-radius theme -->
  <!-- Address Selection Modal -->
  <UModal v-model:open="isAddressModalOpen" title="Adresă de livrare" :ui="{ content: 'sm:max-w-xl p-0' }" class="rounded-md">
    <template #body>
       <div class="">

        <div class="space-y-4 mb-6">
           <div v-if="userAddresses?.length === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-md border border-gray-100">
              Nu ai nicio adresa salvata in cont.
           </div>

           <div v-for="addr in userAddresses" :key="addr.id" class="flex items-start gap-4 p-5 rounded-md border transition-all cursor-pointer group hover:bg-gray-50" :class="selectedAddressId === addr.id ? 'border-primary bg-blue-50/20' : 'border-gray-200'" @click="selectAddress(addr.id)">
              <div class="mt-1 flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors bg-white" :class="selectedAddressId === addr.id ? 'border-primary bg-primary' : 'border-gray-300'">
                 <div v-if="selectedAddressId === addr.id" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
              </div>
              <div class="flex-1">
                 <div class="flex justify-between items-start">
                    <p class="font-bold text-gray-900 text-[15px] group-hover:text-primary transition-colors">{{ addr.firstName }} {{ addr.lastName }} <span class="text-gray-400 font-normal mx-1">·</span> {{ addr.phone }}</p>
                 </div>
                 <p class="text-gray-600 mt-1 pr-12 text-sm leading-relaxed">{{ addr.street }}, {{ addr.city }} ({{ addr.county }})</p>
              </div>
           </div>
        </div>

        <UButton color="neutral" variant="solid" class="rounded-sm font-bold px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800" @click="openNewAddress">
          <UIcon name="i-lucide-plus" class="w-4 h-4 text-white inline align-middle"/> 
          Foloseste alta adresa
        </UButton>

       </div>
    </template>
  </UModal>

  <!-- New Address Form Modal -->
  <UModal v-model:open="isNewAddressModalOpen" title="Adauga adresa noua" :ui="{ content: 'sm:max-w-xl' }" class="rounded-md">
    <template #body>
      <AddressForm 
        :is-first-address="!userAddresses || userAddresses.length === 0" 
        @saved="handleAddressSaved" 
      />
    </template>
  </UModal>
</template>