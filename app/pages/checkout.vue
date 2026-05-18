<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'
import { useCart } from '~/composables/useCart'

definePageMeta({
  middleware: ['authenticated'],
})

// Cart integration
const { cartItems, total, fetchCart, removeFromCart, updateQuantity } = useCart()

// Only fetch from DB when the cart state is empty (e.g. hard page refresh).
// If cartItems already has entries — e.g. carried over from the login/sync flow —
// don't overwrite them with a potentially stale or empty DB response.
if (import.meta.client && cartItems.value.length === 0) {
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
const { data: userBillingAddresses, refresh: refreshBillingAddresses } = await useFetch<any[]>('/api/user/billing-addresses')
const { data: verificationStatus, refresh: refreshVerification } = await useFetch<{ verified: boolean }>('/api/auth/verification-status')

const isEmailVerified = computed(() => !!verificationStatus.value?.verified)
const isResendingVerification = ref(false)
const resendCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown(seconds: number) {
  resendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value -= 1
    if (resendCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

async function resendVerificationEmail() {
  isResendingVerification.value = true
  try {
    await $fetch('/api/auth/send-verification', { method: 'POST' })
    toast.add({ title: 'Email trimis', description: 'Verifica inbox-ul sau folderul de spam pentru linkul de confirmare.', color: 'success' })
    startCooldown(60)
  } catch (e: any) {
    if (e?.statusCode === 429 && e?.data?.data?.retryAfter) {
      startCooldown(e.data.data.retryAfter)
    }
    toast.add({ title: 'Eroare', description: e?.data?.message || 'Nu am putut trimite emailul. Incearca din nou.', color: 'error' })
  } finally {
    isResendingVerification.value = false
  }
}

const onVisibility = () => {
  if (document.visibilityState === 'visible' && !isEmailVerified.value) {
    refreshVerification()
  }
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onUnmounted(() => document.removeEventListener('visibilitychange', onVisibility))

const selectedAddressId = ref<number | null>(null)
const selectedBillingId = ref<number | null>(null)

watchEffect(() => {
  const addresses = userAddresses.value
  if (addresses && addresses.length > 0 && !selectedAddressId.value) {
    const def = addresses.find(a => a.isDefaultShipping)
    selectedAddressId.value = def ? def.id : (addresses[0]?.id || null)
  }
})

watchEffect(() => {
  const bAddresses = userBillingAddresses.value
  if (bAddresses && bAddresses.length > 0 && !selectedBillingId.value) {
    const def = bAddresses.find(a => a.isDefaultBilling)
    selectedBillingId.value = def ? def.id : (bAddresses[0]?.id || null)
  }
})

const selectedAddress = computed(() => {
  return (userAddresses.value || []).find(a => a.id === selectedAddressId.value) || null
})

const selectedBilling = computed(() => {
  return (userBillingAddresses.value || []).find(a => a.id === selectedBillingId.value) || null
})

// State for sections
const deliveryMethod = ref('courier') // 'courier' or 'pickup'
const paymentMethod = ref('transfer') // 'transfer' or 'cash'
const billingSameAsShipping = ref(true)

// Modals State
const isAddressModalOpen = ref(false)
const isNewAddressModalOpen = ref(false)

const isBillingSelectorOpen = ref(false)
const isNewBillingModalOpen = ref(false)

async function handleAddressSaved() {
  const oldIds = new Set((userAddresses.value || []).map(a => a.id))
  await refreshAddresses()
  
  const newAddr = (userAddresses.value || []).find(a => !oldIds.has(a.id))
  if (newAddr) {
    selectedAddressId.value = newAddr.id
  }
  
  isNewAddressModalOpen.value = false
}

function openNewAddress() {
  isAddressModalOpen.value = false
  isNewAddressModalOpen.value = true
}

async function handleBillingSaved() {
  const oldIds = new Set((userBillingAddresses.value || []).map(a => a.id))
  await refreshBillingAddresses()
  
  const newAddr = (userBillingAddresses.value || []).find(a => !oldIds.has(a.id))
  if (newAddr) {
    selectedBillingId.value = newAddr.id
  }
  
  isNewBillingModalOpen.value = false
}

function openNewBilling() {
  isBillingSelectorOpen.value = false
  isNewBillingModalOpen.value = true
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
const courierShippingCost = computed(() => total.value >= 200 ? 0 : 30)

const orderSummaryShippingCost = computed(() => {
  return deliveryMethod.value === 'courier' ? courierShippingCost.value : 0
})

const finalTotal = computed(() => {
  return total.value + orderSummaryShippingCost.value
})
const isSubmitting = ref(false)
const termsAccepted = ref(false)
const toast = useToast()

async function submitOrder() {
  if (isSubmitting.value) return
  if (!isEmailVerified.value) {
    toast.add({ title: 'Confirma adresa de email', description: 'Trebuie sa confirmi adresa de email inainte de a plasa o comanda.', color: 'error' })
    return
  }
  if (!termsAccepted.value) {
    toast.add({ title: 'Accepta termenii si conditiile', description: 'Bifeaza casuta pentru a accepta termenii si conditiile inainte de a plasa comanda.', color: 'error' })
    return
  }

  if (cartItems.value.length === 0) {
    toast.add({ title: 'Cos gol', description: 'Cosul trebuie sa contina produse.', color: 'error' })
    return
  }

  if (deliveryMethod.value === 'courier' && !selectedAddress.value) {
    toast.add({ title: 'Adresa lipsa', description: 'Te rugam sa selectezi o adresa de livrare pentru expedierea prin curier.', color: 'error' })
    return
  }

  if (!billingSameAsShipping.value && !selectedBilling.value) {
     toast.add({ title: 'Facturare lipsa', description: 'Te rugam sa selectezi datele de facturare.', color: 'error' })
     return
  }

  isSubmitting.value = true

  const payload = {
    shippingMethod: deliveryMethod.value,
    paymentMethod: paymentMethod.value,
    shippingAddress: deliveryMethod.value === 'courier' ? selectedAddress.value : null,
    billingAddress: billingSameAsShipping.value ? (deliveryMethod.value === 'courier' ? selectedAddress.value : null) : selectedBilling.value
  }

  try {
    const res = await $fetch('/api/orders', {
      method: 'POST',
      body: payload
    })
    
    await fetchCart() // Refresh local cart composable to empty state
    
    navigateTo({
      path: '/comanda-finalizata',
      query: {
        order: res.orderNumber,
        payment: paymentMethod.value
      }
    })
  } catch(e: any) {
    toast.add({ title: 'Eroare la procesare', description: e?.data?.message || e.statusMessage || e.message || 'Te rugam sa incerci din nou.', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen border-t border-gray-100 flex justify-center pb-20">
    <!-- Form + Summary Container -->
    <div class="w-full max-w-6xl flex flex-col lg:flex-row">
      
      <!-- Left Column (Checkout Form) -->
      <div class="w-full lg:w-3/5 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col gap-8 bg-white border-r border-gray-100">

        <!-- Logo / Title -->
        <div class="mb-2">
           <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">Finalizare comanda</h1>
           <p class="text-gray-500 mt-1">Completeaza detaliile de mai jos.</p>
        </div>

        <UAlert
          v-if="!isEmailVerified"
          color="warning"
          variant="subtle"
          icon="i-lucide-mail-warning"
          title="Confirma adresa de email"
          description="Pentru a putea plasa comanda, te rugam sa confirmi adresa de email."
          class="rounded-sm"
        >
          <template #actions>
            <UButton
              color="warning"
              variant="solid"
              size="sm"
              :loading="isResendingVerification"
              :disabled="resendCooldown > 0"
              class="rounded-sm"
              @click="resendVerificationEmail"
            >
              {{ resendCooldown > 0 ? `Retrimite emailul (${resendCooldown}s)` : 'Retrimite emailul' }}
            </UButton>
          </template>
        </UAlert>

        <!-- 1. Ship to -->
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700">
            <span>Adresa de livrare</span>
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
                 <span class="font-bold inline mb-1">{{ selectedAddress.firstName }} {{ selectedAddress.lastName }}</span><span class="text-gray-500 inline ml-2">· {{ selectedAddress.phone.replace('+40', '0')}}</span>
                 <span class="text-gray-600 block">{{ selectedAddress.street }}</span> 
                 <span class="text-gray-600 block">{{ selectedAddress.city }}, {{ selectedAddress.county }}</span>
               </template>
               <template v-else>
                 <span class="text-gray-500">Alege o adresa de livrare...</span>
               </template>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400 opacity-50 shrink-0" />
          </div>
        </div>

        <!-- 2. Shipping method -->
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700">
            <span>Metoda de livrare</span>
          </div>
          <div class="border border-gray-200 rounded-md overflow-hidden">
            <!-- Courier Option -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors border-b border-gray-200" :class="{'bg-gray-50/50': deliveryMethod === 'courier'}">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="deliveryMethod === 'courier' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="deliveryMethod === 'courier'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <div>
                   <div class="font-semibold text-gray-900 text-sm">Livrare prin Curier</div>
                   <div class="text-gray-500 text-xs mt-0.5">Cu masinile noastre, doar in Bucuresti si Ilfov.</div>
                </div>
              </div>
              <div class="text-sm font-semibold min-w-fit" :class="courierShippingCost === 0 ? 'text-green-600' : 'text-gray-900'">
                {{ courierShippingCost === 0 ? 'Gratuit' : '30.00 RON' }}
              </div>
              <input type="radio" value="courier" v-model="deliveryMethod" class="hidden">
            </label>

            <div v-show="deliveryMethod === 'courier'" class="p-5 bg-gray-50 border-b border-gray-200 space-y-4">
               <div class="text-sm text-gray-600 text-justify flex flex-col items-center gap-2">
                <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
                <p class="text-sm text-gray-600"> Livrarea se face in 2-3 zile lucratoare de la primirea facturii pe mail si dupa ce comanda a fost confirmata telefonic.</p>
               </div>
            </div>

            <!-- Pickup Option -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors" :class="{'bg-gray-50/50': deliveryMethod === 'pickup'}">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="deliveryMethod === 'pickup' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="deliveryMethod === 'pickup'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <div>
                   <div class="font-semibold text-gray-900 text-sm">Ridicare Personala</div>
                   <div class="text-gray-500 text-xs mt-0.5">De la <a href="/despre-noi#locatie" class="text-primary underline">sediul nostru</a></div>
                </div>
              </div>
              <div class="text-sm font-semibold text-gray-900 min-w-fit">Gratuit</div>
              <input type="radio" value="pickup" v-model="deliveryMethod" class="hidden">
            </label>


            <div v-show="deliveryMethod === 'pickup'" class="p-5 bg-gray-50 border-t border-gray-200 text-justify lg:text-left flex flex-col items-center gap-2">
               <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
               <p class="text-sm text-gray-600">Comanda va fi pregatita in maximum 2 zile lucratoare de la confirmare. Te vom anunta pe email cand aceasta este gata de ridicare.</p>
            </div>
          </div>
        </div>

        <!-- 3. Payment block -->
        <div class="flex flex-col gap-3 mt-2">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Plata</h3>
            <!-- <p class="text-sm text-gray-500 mt-1">Toate tranzactiile sunt securizate si criptate.</p> -->
          </div>
          <div class="border border-gray-200 rounded-md overflow-hidden mt-1">
            <!-- Bank Transfer -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors border-b border-gray-200"
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
               <div class="text-sm text-gray-600 text-justify lg:text-left flex flex-col items-center gap-2">
                 <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
                 <p> Efectueaza plata in contul nostru bancar dupa primirea facturii proforme pe mail. Te rugam sa specifici numarul comenzii la detalii.</p>
               </div>
            </div>

            <!-- Cash on Delivery Option -->
            <label class="px-5 py-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                   :class="{ 'bg-blue-50/10': paymentMethod === 'cash' }">
              <div class="flex items-center gap-4">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'">
                  <div v-if="paymentMethod === 'cash'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900">Ramburs la curier</span>
              </div>
              <!-- Money icon -->
              <UIcon name="i-lucide-banknote" class="w-6 h-6 text-gray-400"></UIcon>
              <input type="radio" value="cash" v-model="paymentMethod" class="hidden">
            </label>
            
            <div v-show="paymentMethod === 'cash'" class="p-5 bg-gray-50 border-t border-gray-200 text-justify lg:text-left flex flex-col items-center gap-2">
               <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
               <p class="text-sm text-gray-600">Plata se va face in numerar la primirea coletului. Dupa primirea facturii pe mail, te vom contacta pentru confirmare si pentru stabilirea datei livrarii.</p>
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
              <span class="text-sm font-medium text-gray-900">Aceeasi cu adresa de livrare</span>
              <input type="radio" :value="true" v-model="billingSameAsShipping" class="hidden">
            </label>
            <label class="p-4 flex items-center gap-4 cursor-pointer bg-white hover:bg-gray-50" :class="{ 'bg-blue-50/10 hover:bg-blue-50/20': !billingSameAsShipping }">
              <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="!billingSameAsShipping ? 'border-primary' : 'border-gray-300'">
                <div v-if="!billingSameAsShipping" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
              </div>
              <span class="text-sm font-medium text-gray-900">Adresa de facturare persoana juridica</span>
              <input type="radio" :value="false" v-model="billingSameAsShipping" class="hidden">
            </label>
            <div v-if="!billingSameAsShipping" class="text-sm p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors" @click="isBillingSelectorOpen = true">
               <div>
                  <template v-if="selectedBilling">
                     <span class="font-bold inline mb-1">{{ selectedBilling.companyName }}</span><span class="text-gray-500 inline ml-2">· {{ selectedBilling.hasRo ? 'RO' : '' }}{{ selectedBilling.cui }}</span>
                     <span class="text-gray-600 block">{{ selectedBilling.street }}</span> 
                     <span class="text-gray-600 block">{{ selectedBilling.city }}, {{ selectedBilling.county }}</span>
                  </template>
                  <template v-else>
                     <span class="text-gray-500">Alege o adresa de facturare...</span>
                  </template>
               </div>
               <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400 opacity-50 shrink-0" />
            </div>
          </div>
        </div>

        <!-- Extra / Submit -->
         <div class="mt-6 hidden lg:block">
            <UCheckbox v-model="termsAccepted" class="mb-4">
              <template #label>
                <span class="text-sm text-gray-700">
                  Sunt de acord cu <NuxtLink to="/termeni-si-conditii" target="_blank" class="text-primary underline font-medium">termenii si conditiile</NuxtLink> si <NuxtLink to="/politica-de-confidentialitate" target="_blank" class="text-primary underline font-medium">politica de confidentialitate</NuxtLink>.
                </span>
              </template>
            </UCheckbox>
            <UButton :loading="isSubmitting" :disabled="!isEmailVerified || !termsAccepted || isSubmitting" @click="submitOrder" block size="xl" class="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-md shadow-lg transition-transform active:scale-[0.98] flex justify-center">
               Plaseaza comanda
            </UButton>
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
            <div class="flex justify-between items-center text-base text-gray-600">
              <span>Subtotal</span>
              <span class="font-bold text-gray-800">{{ total.toFixed(2) }} RON</span>
            </div>
            <div class="flex justify-between items-center text-base text-gray-600">
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

        <div class="mt-6 lg:hidden">
           <UCheckbox v-model="termsAccepted" class="mb-4">
             <template #label>
               <span class="text-sm text-gray-700">
                 Sunt de acord cu <NuxtLink to="/termeni-si-conditii" target="_blank" class="text-primary underline font-medium">termenii si conditiile</NuxtLink> si <NuxtLink to="/politica-de-confidentialitate" target="_blank" class="text-primary underline font-medium">politica de confidentialitate</NuxtLink>.
               </span>
             </template>
           </UCheckbox>
           <UButton :loading="isSubmitting" :disabled="!isEmailVerified || !termsAccepted || isSubmitting" @click="submitOrder" block size="xl" class="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-md shadow-lg transition-transform active:scale-[0.98] flex justify-center">
              Plaseaza comanda
           </UButton>
        </div>
      </div>

    </div>
  </div>

  <!-- Modals remain the same functionally, only minor classes to match the new border-radius theme -->
  <!-- Address Selection Modal -->
  <AddressSelectorModal 
    v-model:open="isAddressModalOpen" 
    v-model:selectedId="selectedAddressId" 
    title="Adresa de livrare" 
    :items="userAddresses" 
    empty-message="Nu ai nicio adresa salvata in cont."
    @add-new="openNewAddress"
  >
    <template #item="{ item }">
      <div class="flex justify-between items-start">
         <p class="font-bold mb-1 text-gray-900 text-base group-hover:text-primary transition-colors">{{ item.firstName }} {{ item.lastName }} <span class="text-gray-400 font-normal mx-1">·</span> {{ item.phone.replace('+40', '0')}}</p>
      </div>
      <p class="text-gray-600 text-sm leading-relaxed">{{ item.street }}</p>
      <p class="text-gray-600 text-sm leading-relaxed">{{ item.city }}, {{ item.county }}</p>
    </template>
  </AddressSelectorModal>

  <!-- Billing Selection Modal -->
  <AddressSelectorModal 
    v-model:open="isBillingSelectorOpen" 
    v-model:selectedId="selectedBillingId" 
    title="Adresa de facturare (Companie)" 
    :items="userBillingAddresses" 
    empty-message="Nu ai nicio companie salvata in cont."
    @add-new="openNewBilling"
  >
    <template #item="{ item }">
      <div class="flex justify-starty items-center gap-2">
        <p class="font-bold mb-1 text-gray-900 text-base group-hover:text-primary transition-colors">{{ item.companyName }}</p>
        <p class="text-gray-600 text-sm leading-relaxed">· {{ item.hasRo ? 'RO' : '' }}{{ item.cui }}</p>
      </div>
      <p class="text-gray-600 text-sm leading-relaxed">Reg. Com.: {{ item.onrc }}</p>
      <p class="text-gray-600 text-sm leading-relaxed">{{ item.street }}</p>
      <p class="text-gray-600 text-sm leading-relaxed">{{ item.city }}, {{ item.county }}</p>
    </template>
  </AddressSelectorModal>

  <!-- New Address Form Modal -->
  <UModal v-model:open="isNewAddressModalOpen" title="Adauga adresa noua" :ui="{ content: 'sm:max-w-xl' }" class="rounded-md">
    <template #body>
      <AddressForm 
        :is-first-address="!userAddresses || userAddresses.length === 0" 
        @saved="handleAddressSaved" 
      />
    </template>
  </UModal>

  <!-- New Billing Form Modal -->
  <UModal v-model:open="isNewBillingModalOpen" title="Adauga persoana juridica" :ui="{ content: 'sm:max-w-xl' }" class="rounded-md">
    <template #body>
      <BillingAddressForm 
        :is-first-address="!userBillingAddresses || userBillingAddresses.length === 0" 
        @saved="handleBillingSaved" 
      />
    </template>
  </UModal>
</template>