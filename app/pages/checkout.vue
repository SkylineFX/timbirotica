<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useCart } from '~/composables/useCart'
import { COURIER_DELIVERY_DAYS, getCourierShippingCost } from '~~/shared/constants/order'
import { sameCartQuantities } from '~~/shared/utils/cart'
import { fetchFailure } from '~~/shared/utils/fetchFailure'
import { fromBani, toBani, vatBreakdown } from '~~/shared/utils/money'

definePageMeta({
  middleware: ['authenticated']
})

// Cart integration
const { cartItems, total, fetchCart, syncCart, cartLocked } = useCart()

// Always show the server's cart, because the order is built from it. Merge any
// guest products first: a tab that showed the guest view can hold products the
// server doesn't know about yet.
onMounted(() => {
  syncCart()
})

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

const { data: userAddresses, refresh: refreshAddresses } =
  await useFetch<Address[]>('/api/user/addresses')
const { data: userBillingAddresses, refresh: refreshBillingAddresses } = await useFetch(
  '/api/user/billing-addresses'
)
const { data: verificationStatus, refresh: refreshVerification } = await useFetch<{
  verified: boolean
}>('/api/auth/verification-status')

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
    toast.add({
      title: 'Email trimis',
      description: 'Verifica inbox-ul sau folderul de spam pentru linkul de confirmare.',
      color: 'success'
    })
    startCooldown(60)
  } catch (e) {
    const failure = fetchFailure(e)
    const retryAfter = failure.data.retryAfter
    if (failure.status === 429 && typeof retryAfter === 'number' && retryAfter) {
      startCooldown(retryAfter)
    }
    toast.add({
      title: 'Eroare',
      description: failure.message || 'Nu am putut trimite emailul. Incearca din nou.',
      color: 'error'
    })
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
// Individual invoice address (Persoana fizica) — for courier it defaults to the delivery address but can be changed
const selectedBillingAddressId = ref<number | null>(null)
// Which selector the "add new address" flow should assign to
const newAddressTarget = ref<'shipping' | 'billing'>('shipping')

watchEffect(() => {
  const addresses = userAddresses.value
  if (addresses && addresses.length > 0 && !selectedAddressId.value) {
    const def = addresses.find((a) => a.isDefaultShipping)
    selectedAddressId.value = def ? def.id : addresses[0]?.id || null
  }
})

watchEffect(() => {
  const bAddresses = userBillingAddresses.value
  if (bAddresses && bAddresses.length > 0 && !selectedBillingId.value) {
    const def = bAddresses.find((a) => a.isDefaultBilling)
    selectedBillingId.value = def ? def.id : bAddresses[0]?.id || null
  }
})

// Default: billing follows shipping. Whenever the delivery/personal address
// changes, the invoice address syncs to it. Picking a different invoice
// address in the billing modal only changes billing (the modal's v-model
// writes selectedBillingAddressId directly and doesn't trigger this watch),
// and that choice holds until the user changes the shipping address again.
watch(
  selectedAddressId,
  (newId) => {
    if (newId) selectedBillingAddressId.value = newId
  },
  { immediate: true }
)

const selectedAddress = computed(() => {
  return (userAddresses.value || []).find((a) => a.id === selectedAddressId.value) || null
})

const selectedBilling = computed(() => {
  return (userBillingAddresses.value || []).find((a) => a.id === selectedBillingId.value) || null
})

const selectedBillingAddress = computed(() => {
  return (userAddresses.value || []).find((a) => a.id === selectedBillingAddressId.value) || null
})

// State for sections
const deliveryMethod = ref('courier') // 'courier' or 'pickup'
const paymentMethod = ref('transfer') // 'transfer' or 'cash'
// Temporarily disabled: 'Ramburs la curier' (cash on delivery). Flip to true to re-enable.
const cashPaymentEnabled = false
const billingSameAsShipping = ref(true)

// Modals State
const isAddressModalOpen = ref(false)
const isNewAddressModalOpen = ref(false)

const isBillingSelectorOpen = ref(false)
const isNewBillingModalOpen = ref(false)
const isBillingAddressSelectorOpen = ref(false)

async function handleAddressSaved() {
  const oldIds = new Set((userAddresses.value || []).map((a) => a.id))
  await refreshAddresses()

  const newAddr = (userAddresses.value || []).find((a) => !oldIds.has(a.id))
  if (newAddr) {
    if (newAddressTarget.value === 'billing') selectedBillingAddressId.value = newAddr.id
    else selectedAddressId.value = newAddr.id
  }

  newAddressTarget.value = 'shipping'
  isNewAddressModalOpen.value = false
}

function openNewAddress() {
  newAddressTarget.value = 'shipping'
  isAddressModalOpen.value = false
  isNewAddressModalOpen.value = true
}

function openNewBillingAddress() {
  newAddressTarget.value = 'billing'
  isBillingAddressSelectorOpen.value = false
  isNewAddressModalOpen.value = true
}

async function handleBillingSaved() {
  const oldIds = new Set((userBillingAddresses.value || []).map((a) => a.id))
  await refreshBillingAddresses()

  const newAddr = (userBillingAddresses.value || []).find((a) => !oldIds.has(a.id))
  if (newAddr) {
    selectedBillingId.value = newAddr.id
  }

  isNewBillingModalOpen.value = false
}

function openNewBilling() {
  isBillingSelectorOpen.value = false
  isNewBillingModalOpen.value = true
}

// Computed totals
const courierShippingCost = computed(() => getCourierShippingCost(total.value))

const orderSummaryShippingCost = computed(() => {
  return deliveryMethod.value === 'courier' ? courierShippingCost.value : 0
})

const finalTotal = computed(() => {
  return fromBani(toBani(total.value) + toBani(orderSummaryShippingCost.value))
})

// The VAT included in the total, worked out per line like the proforma, so the
// two show the same amount.
const finalVat = computed(() =>
  fromBani(
    vatBreakdown(
      cartItems.value.map((item) => ({ price: item.product?.price || 0, quantity: item.quantity })),
      orderSummaryShippingCost.value
    ).vat
  )
)
const isSubmitting = ref(false)
const termsAccepted = ref(false)
const toast = useToast()

async function submitOrder() {
  if (isSubmitting.value) return
  if (!isEmailVerified.value) {
    toast.add({
      title: 'Confirma adresa de email',
      description: 'Trebuie sa confirmi adresa de email inainte de a plasa o comanda.',
      color: 'error'
    })
    return
  }
  if (!termsAccepted.value) {
    toast.add({
      title: 'Accepta termenii si conditiile',
      description:
        'Bifeaza casuta pentru a accepta termenii si conditiile inainte de a plasa comanda.',
      color: 'error'
    })
    return
  }

  // Block a second submit from here on, including while the cart refreshes
  // below, and lock the cart everywhere on the page (these lines, the header's
  // cart, favorites) until the order is placed.
  isSubmitting.value = true
  cartLocked.value = true
  try {
    // The prices the customer is looking at, taken first: a cart read that
    // answers during the waits below can bring newer prices, and the server
    // must still refuse the order (409) if a price changed meanwhile.
    // With them, the products and quantities on screen: the order must be this
    // cart, which the server checks too.
    const priceSnapshots = cartItems.value.map((item) => ({
      productId: item.productId,
      price: item.product?.price ?? 0,
      quantity: item.quantity
    }))

    // The server orders the cart it holds, so send any quantity change still
    // waiting, before syncCart(): it sends them too but ignores a failure. The
    // cart is locked, so nothing changes after this. If a change failed, the
    // line is back at the server's quantity, with a toast: stop, so the
    // customer sees what would be ordered.
    if (!(await flushCartQuantityUpdates())) return

    // Merge any guest products first, so the cart the server orders is the cart
    // shown here.
    await syncCart()

    // The cart read back from the server can differ from the one on screen:
    // a quantity change that failed on screen but was saved, or a change from
    // another tab. The page now shows the server's cart; stop so the customer
    // checks it, and the next click orders what is shown.
    if (!sameCartQuantities(priceSnapshots, cartItems.value)) {
      toast.add({
        title: 'Cosul s-a actualizat',
        description: 'Verifica produsele si cantitatile, apoi plaseaza comanda din nou.',
        color: 'warning'
      })
      return
    }

    if (cartItems.value.length === 0) {
      toast.add({
        title: 'Cos gol',
        description: 'Cosul trebuie sa contina produse.',
        color: 'error'
      })
      return
    }

    // Personal address is required for courier delivery, or as the individual invoice (persoana fizica)
    if (
      (deliveryMethod.value === 'courier' || billingSameAsShipping.value) &&
      !selectedAddress.value
    ) {
      toast.add({
        title: 'Adresa lipsa',
        description: 'Te rugam sa selectezi o adresa.',
        color: 'error'
      })
      return
    }

    if (!billingSameAsShipping.value && !selectedBilling.value) {
      toast.add({
        title: 'Facturare lipsa',
        description: 'Te rugam sa selectezi datele de facturare.',
        color: 'error'
      })
      return
    }

    if (
      billingSameAsShipping.value &&
      deliveryMethod.value === 'courier' &&
      !selectedBillingAddress.value
    ) {
      toast.add({
        title: 'Adresa de facturare lipsa',
        description: 'Te rugam sa selectezi adresa de facturare.',
        color: 'error'
      })
      return
    }

    const payload = {
      shippingMethod: deliveryMethod.value,
      paymentMethod: paymentMethod.value,
      shippingAddressId:
        deliveryMethod.value === 'courier' || billingSameAsShipping.value
          ? selectedAddressId.value
          : null,
      billingSameAsShipping: billingSameAsShipping.value,
      billingAddressId: billingSameAsShipping.value ? null : selectedBillingId.value,
      billingPersonalAddressId:
        billingSameAsShipping.value && deliveryMethod.value === 'courier'
          ? selectedBillingAddressId.value
          : null,
      termsAccepted: true as const,
      priceSnapshots
    }

    const res = await $fetch('/api/orders', {
      method: 'POST',
      body: payload
    })

    await fetchCart() // Refresh local cart composable to empty state

    navigateTo(
      {
        path: '/comanda-finalizata',
        query: {
          order: res.orderNumber,
          payment: paymentMethod.value,
          shipping: deliveryMethod.value
        }
      },
      { replace: true }
    )
  } catch (e) {
    const failure = fetchFailure(e)
    // Price-change retry path: refresh the cart so the right column reflects
    // the new prices and the user can re-confirm.
    if (failure.status === 409 && failure.data.priceChanged) {
      await fetchCart()
      toast.add({
        title: 'Preturi actualizate',
        description: 'Verifica suma totala si reincearca.',
        color: 'warning'
      })
      return
    }
    // The server's cart differs from the one shown (see the check before the
    // order): show its cart, and the next click orders what is shown.
    if (failure.status === 409 && failure.data.cartChanged) {
      await fetchCart()
      toast.add({
        title: 'Cosul s-a actualizat',
        description: 'Verifica produsele si cantitatile, apoi plaseaza comanda din nou.',
        color: 'warning'
      })
      return
    }
    // Without a message from the server: a FetchError's status text, then its
    // summary ("[POST] "/api/orders": ..."), or the message of any other error.
    const statusText =
      typeof e === 'object' &&
      e !== null &&
      'statusMessage' in e &&
      typeof e.statusMessage === 'string'
        ? e.statusMessage
        : ''
    const errorText = e instanceof Error ? e.message : ''
    toast.add({
      title: 'Eroare la procesare',
      description: failure.message || statusText || errorText || 'Te rugam sa incerci din nou.',
      color: 'error'
    })
    // Show the server's cart after a failure (e.g. a product just became
    // unavailable), so the page never keeps showing a cart that can't be ordered.
    await fetchCart()
  } finally {
    isSubmitting.value = false
    cartLocked.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen justify-center border-t border-gray-100 pb-20">
    <!-- Form + Summary Container -->
    <div class="flex w-full max-w-6xl flex-col lg:flex-row">
      <!-- Left Column (Checkout Form) -->
      <div
        class="flex w-full flex-col gap-8 border-r border-gray-100 bg-white px-4 py-8 sm:px-6 lg:w-1/2 lg:px-8 lg:py-12"
      >
        <!-- Logo / Title -->
        <div class="mb-2">
          <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">Finalizare comanda</h1>
          <p class="mt-1 text-gray-500">Completeaza detaliile de mai jos.</p>
        </div>

        <UAlert
          v-if="!isEmailVerified"
          color="primary"
          variant="subtle"
          icon="i-lucide-mail-warning"
          title="Confirma adresa de email"
          description="Pentru a putea plasa comanda, te rugam sa confirmi adresa de email."
          class="rounded-sm"
        >
          <template #actions>
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              :loading="isResendingVerification"
              :disabled="resendCooldown > 0"
              class="rounded-sm"
              @click="resendVerificationEmail"
            >
              {{
                resendCooldown > 0 ? `Retrimite emailul (${resendCooldown}s)` : 'Retrimite emailul'
              }}
            </UButton>
          </template>
        </UAlert>

        <!-- 1. Shipping method -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>Metoda de livrare</span>
          </div>
          <div class="overflow-hidden rounded-md border border-gray-200">
            <!-- Courier Option -->
            <label
              class="flex cursor-pointer items-center justify-between border-b border-gray-200 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
              :class="{ 'bg-gray-50/50': deliveryMethod === 'courier' }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                  :class="deliveryMethod === 'courier' ? 'border-primary' : 'border-gray-300'"
                >
                  <div
                    v-if="deliveryMethod === 'courier'"
                    class="h-2.5 w-2.5 rounded-full bg-primary"
                  ></div>
                </div>
                <div>
                  <div class="text-sm font-semibold text-gray-900">Livrare prin Curier</div>
                  <!-- <div class="text-gray-500 text-xs mt-0.5">Doar in Bucuresti si Ilfov</div> -->
                </div>
              </div>
              <div
                class="min-w-fit text-sm font-semibold"
                :class="courierShippingCost === 0 ? 'text-green-600' : 'text-gray-900'"
              >
                {{
                  courierShippingCost === 0 ? 'Gratuit' : `${courierShippingCost.toFixed(2)} RON`
                }}
              </div>
              <input v-model="deliveryMethod" type="radio" value="courier" class="hidden" />
            </label>

            <div
              v-show="deliveryMethod === 'courier'"
              class="space-y-4 border-b border-gray-200 bg-gray-50 p-5"
            >
              <div class="flex flex-col items-center gap-2 text-left text-sm text-gray-600">
                <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
                <p class="text-sm text-gray-600">
                  Livrarea se face in {{ COURIER_DELIVERY_DAYS }} zile lucratoare de la primirea
                  facturii proforme pe mail, dupa ce comanda a fost confirmata.
                </p>
              </div>
            </div>

            <!-- Pickup Option -->
            <label
              class="flex cursor-pointer items-center justify-between bg-white px-5 py-4 transition-colors hover:bg-gray-50"
              :class="{ 'bg-gray-50/50': deliveryMethod === 'pickup' }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                  :class="deliveryMethod === 'pickup' ? 'border-primary' : 'border-gray-300'"
                >
                  <div
                    v-if="deliveryMethod === 'pickup'"
                    class="h-2.5 w-2.5 rounded-full bg-primary"
                  ></div>
                </div>
                <div>
                  <div class="text-sm font-semibold text-gray-900">Ridicare Personala</div>
                  <div class="mt-0.5 text-xs text-gray-500">
                    De la
                    <a href="/despre-noi#locatie" class="text-primary underline">sediul nostru</a>
                  </div>
                </div>
              </div>
              <div class="min-w-fit text-sm font-semibold text-gray-900">Gratuit</div>
              <input v-model="deliveryMethod" type="radio" value="pickup" class="hidden" />
            </label>

            <div
              v-show="deliveryMethod === 'pickup'"
              class="flex flex-col items-center gap-2 border-t border-gray-200 bg-gray-50 p-5 text-left lg:text-left"
            >
              <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
              <p class="text-sm text-gray-600">
                Comanda va fi pregatita in maximum 2 zile lucratoare de la confirmare. Te vom anunta
                cand aceasta este gata de ridicare.
              </p>
            </div>
          </div>
        </div>

        <!-- 2. Delivery address (courier only; pickup collects it under Facturare) -->
        <div v-show="deliveryMethod === 'courier'" class="flex flex-col gap-3">
          <div class="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>Adresa de livrare</span>
            <button
              aria-label="Schimba adresa de livrare"
              class="text-blue-600 transition hover:text-blue-700"
              @click="isAddressModalOpen = true"
            >
              <UIcon name="i-lucide-chevron-down" class="ml-1 inline h-4 w-4 align-middle" />
            </button>
          </div>
          <div
            class="flex cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-900 transition-colors hover:border-gray-300"
            @click="isAddressModalOpen = true"
          >
            <div>
              <template v-if="selectedAddress">
                <span class="mb-1 inline font-bold"
                  >{{ selectedAddress.firstName }} {{ selectedAddress.lastName }}</span
                ><span class="ml-2 inline text-gray-500">· {{ selectedAddress.phone }}</span>
                <span class="block text-gray-600">{{ selectedAddress.street }}</span>
                <span class="block text-gray-600"
                  >{{ selectedAddress.city }}, {{ selectedAddress.county }}</span
                >
              </template>
              <template v-else>
                <span class="text-gray-500">Alege o adresa...</span>
              </template>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="h-5 w-5 shrink-0 text-gray-400 opacity-50"
            />
          </div>
        </div>

        <!-- 3. Payment block -->
        <div class="mt-2 flex flex-col gap-3">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Plata</h3>
            <!-- <p class="text-sm text-gray-500 mt-1">Toate tranzactiile sunt securizate si criptate.</p> -->
          </div>
          <div class="mt-1 overflow-hidden rounded-md border border-gray-200">
            <!-- Bank Transfer -->
            <label
              class="flex cursor-pointer items-center justify-between border-b border-gray-200 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
              :class="{ 'bg-blue-50/10': paymentMethod === 'transfer' }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                  :class="paymentMethod === 'transfer' ? 'border-primary' : 'border-gray-300'"
                >
                  <div
                    v-if="paymentMethod === 'transfer'"
                    class="h-2.5 w-2.5 rounded-full bg-primary"
                  ></div>
                </div>
                <span class="text-sm font-semibold text-gray-900">Transfer bancar</span>
              </div>
              <!-- <div class="flex items-center gap-2">
                 <UIcon name="i-lucide-building-2" class="w-6 h-6 text-gray-400" />
              </div> -->
              <input v-model="paymentMethod" type="radio" value="transfer" class="hidden" />
            </label>

            <!-- Bank transfer info -->
            <div
              v-show="paymentMethod === 'transfer'"
              class="space-y-4 border-gray-200 bg-gray-50 p-5"
            >
              <!-- border-b -->
              <div
                class="flex flex-col items-center gap-2 text-left text-sm text-gray-600 lg:text-left"
              >
                <!-- <UIcon name="i-lucide-info" class="w-6 h-6 text-gray-400" /> -->
                <p>
                  Dupa plasarea comenzii iti vom trimite pe email factura proforma cu toate
                  detaliile de plata.
                </p>
              </div>
            </div>

            <!-- Cash on Delivery Option -->
            <template v-if="cashPaymentEnabled">
              <label
                class="flex cursor-pointer items-center justify-between bg-white px-5 py-4 transition-colors hover:bg-gray-50"
                :class="{ 'bg-blue-50/10': paymentMethod === 'cash' }"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                    :class="paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'"
                  >
                    <div
                      v-if="paymentMethod === 'cash'"
                      class="h-2.5 w-2.5 rounded-full bg-primary"
                    ></div>
                  </div>
                  <span class="text-sm font-semibold text-gray-900">Ramburs la curier</span>
                </div>
                <!-- Money icon -->
                <UIcon name="i-lucide-banknote" class="h-6 w-6 text-gray-400"></UIcon>
                <input v-model="paymentMethod" type="radio" value="cash" class="hidden" />
              </label>

              <div
                v-show="paymentMethod === 'cash'"
                class="border-t border-gray-200 bg-gray-50 p-5 text-left lg:text-left"
              >
                <p v-if="deliveryMethod === 'courier'" class="text-sm text-gray-600">
                  Plata se face in numerar la primirea coletului. Vei primi factura proforma pe
                  mail, apoi te vom contacta pentru confirmarea comenzii si stabilirea datei de
                  livrare.
                </p>
                <p v-else class="text-sm text-gray-600">
                  Plata se face in numerar la ridicarea comenzii. Vei primi factura proforma pe
                  mail, apoi te vom contacta cand comanda este gata.
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- 4. Billing Address block -->
        <div class="mt-2 flex flex-col gap-3">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Facturare</h3>
          </div>
          <div
            class="mt-1 divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200"
          >
            <label
              class="flex cursor-pointer items-center gap-4 bg-white p-4 hover:bg-gray-50"
              :class="{ 'bg-blue-50/10 hover:bg-blue-50/20': billingSameAsShipping }"
            >
              <div
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                :class="billingSameAsShipping ? 'border-primary' : 'border-gray-300'"
              >
                <div v-if="billingSameAsShipping" class="h-2.5 w-2.5 rounded-full bg-primary"></div>
              </div>
              <span class="text-sm font-medium text-gray-900">Persoana fizica</span>
              <input v-model="billingSameAsShipping" type="radio" :value="true" class="hidden" />
            </label>
            <label
              class="flex cursor-pointer items-center gap-4 bg-white p-4 hover:bg-gray-50"
              :class="{ 'bg-blue-50/10 hover:bg-blue-50/20': !billingSameAsShipping }"
            >
              <div
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                :class="!billingSameAsShipping ? 'border-primary' : 'border-gray-300'"
              >
                <div
                  v-if="!billingSameAsShipping"
                  class="h-2.5 w-2.5 rounded-full bg-primary"
                ></div>
              </div>
              <span class="text-sm font-medium text-gray-900">Persoana juridica</span>
              <input v-model="billingSameAsShipping" type="radio" :value="false" class="hidden" />
            </label>
            <div
              v-if="!billingSameAsShipping"
              class="flex cursor-pointer items-center justify-between bg-gray-50 p-4 text-sm transition-colors hover:bg-gray-100"
              @click="isBillingSelectorOpen = true"
            >
              <div>
                <template v-if="selectedBilling">
                  <span class="mb-1 inline font-bold">{{ selectedBilling.companyName }}</span><span
                    class="ml-2 inline text-gray-500"
                    >· {{ selectedBilling.hasRo ? 'RO' : '' }}{{ selectedBilling.cui }}</span
                  >
                  <span class="block text-gray-600">{{ selectedBilling.street }}</span>
                  <span class="block text-gray-600"
                    >{{ selectedBilling.city }}, {{ selectedBilling.county }}</span
                  >
                </template>
                <template v-else>
                  <span class="text-gray-500">Alege o adresa de facturare...</span>
                </template>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-5 w-5 shrink-0 text-gray-400 opacity-50"
              />
            </div>
            <!-- Persoana fizica: for pickup, pick the personal/invoice address here (courier reuses the delivery address) -->
            <div
              v-if="billingSameAsShipping && deliveryMethod === 'pickup'"
              class="flex cursor-pointer items-center justify-between bg-gray-50 p-4 text-sm transition-colors hover:bg-gray-100"
              @click="isAddressModalOpen = true"
            >
              <div>
                <template v-if="selectedAddress">
                  <span class="mb-1 inline font-bold"
                    >{{ selectedAddress.firstName }} {{ selectedAddress.lastName }}</span
                  ><span class="ml-2 inline text-gray-500">· {{ selectedAddress.phone }}</span>
                  <span class="block text-gray-600">{{ selectedAddress.street }}</span>
                  <span class="block text-gray-600"
                    >{{ selectedAddress.city }}, {{ selectedAddress.county }}</span
                  >
                </template>
                <template v-else>
                  <span class="text-gray-500">Alege o adresa...</span>
                </template>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-5 w-5 shrink-0 text-gray-400 opacity-50"
              />
            </div>
            <!-- Persoana fizica + courier: invoice address (defaults to the delivery address; can be changed) -->
            <div
              v-if="billingSameAsShipping && deliveryMethod === 'courier'"
              class="flex cursor-pointer items-center justify-between bg-gray-50 p-4 text-sm transition-colors hover:bg-gray-100"
              @click="isBillingAddressSelectorOpen = true"
            >
              <div>
                <template v-if="selectedBillingAddress">
                  <span class="mb-1 inline font-bold"
                    >{{ selectedBillingAddress.firstName }}
                    {{ selectedBillingAddress.lastName }}</span
                  ><span class="ml-2 inline text-gray-500"
                    >· {{ selectedBillingAddress.phone }}</span
                  >
                  <span class="block text-gray-600">{{ selectedBillingAddress.street }}</span>
                  <span class="block text-gray-600"
                    >{{ selectedBillingAddress.city }}, {{ selectedBillingAddress.county }}</span
                  >
                </template>
                <template v-else>
                  <span class="text-gray-500">Alege adresa de facturare...</span>
                </template>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-5 w-5 shrink-0 text-gray-400 opacity-50"
              />
            </div>
          </div>
        </div>

        <!-- Extra / Submit (desktop) -->
        <CheckoutSubmit
          v-model:terms-accepted="termsAccepted"
          :is-submitting="isSubmitting"
          :is-email-verified="isEmailVerified"
          class="mt-6 hidden lg:block"
          @submit="submitOrder"
        />
      </div>

      <!-- Right Column (Order Summary) -->
      <div
        class="flex w-full flex-col gap-6 border-b border-gray-200 bg-gray-50/50 p-6 lg:w-1/2 lg:border-b-0 lg:border-l lg:p-12 lg:pl-10"
      >
        <!-- Summary -->
        <div>
          <h3 class="text-xl font-bold text-gray-900">Sumar comanda</h3>
        </div>
        <!-- Items -->
        <div class="flex max-h-[50vh] flex-col gap-5 overflow-y-auto pr-2">
          <!-- Empty state -->
          <div v-if="!cartItems.length" class="py-10 text-center text-gray-500">
            Cosul tau este gol.
          </div>

          <CartItem v-for="item in cartItems" :key="item.id" :item="item" variant="checkout" />
        </div>

        <!-- Totals -->
        <div class="mt-2 space-y-3 border-t border-gray-200 pt-6">
          <div class="flex items-center justify-between text-base text-gray-600">
            <span>Subtotal</span>
            <span class="font-bold text-gray-800">{{ total.toFixed(2) }} RON</span>
          </div>
          <div class="flex items-center justify-between text-base text-gray-600">
            <span class="flex items-center gap-1">
              Livrare
              <NuxtLink
                to="/termeni-si-conditii#livrare"
                aria-label="Detalii despre livrare"
                class="flex cursor-pointer items-center"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="h-3.5 w-3.5 text-gray-400 transition-colors hover:text-primary"
                />
              </NuxtLink>
            </span>
            <span class="font-bold tracking-tight text-gray-800"
              >{{ orderSummaryShippingCost.toFixed(2) }} RON</span
            >
          </div>
        </div>

        <!-- Final Total -->
        <div
          class="mt-4 flex items-end justify-between border-t border-dashed border-gray-300 pt-6"
        >
          <div class="flex flex-col">
            <span class="text-xl font-extrabold text-gray-900">Total</span>
            <span v-if="finalTotal > 0" class="mt-0.5 text-xs text-gray-500"
              >Include TVA de {{ finalVat.toFixed(2) }} RON</span
            >
          </div>
          <div class="mb-0.5 flex items-end gap-2">
            <span
              class="text-2xl leading-none font-extrabold tracking-tight text-gray-900 sm:text-3xl"
              >{{ finalTotal.toFixed(2) }} RON</span
            >
          </div>
        </div>

        <!-- Extra / Submit (mobile) -->
        <CheckoutSubmit
          v-model:terms-accepted="termsAccepted"
          :is-submitting="isSubmitting"
          :is-email-verified="isEmailVerified"
          class="mt-6 lg:hidden"
          @submit="submitOrder"
        />
      </div>
    </div>

    <!-- Modals remain the same functionally, only minor classes to match the new border-radius theme -->
    <!-- Address Selection Modal -->
    <AddressSelectorModal
      v-model:open="isAddressModalOpen"
      v-model:selected-id="selectedAddressId"
      title="Adresa de livrare"
      :items="userAddresses"
      empty-message="Nu ai nicio adresa salvata in cont."
      @add-new="openNewAddress"
    >
      <template #item="{ item }">
        <div class="flex items-start justify-between">
          <p class="mb-1 text-base font-bold text-gray-900 transition-colors">
            {{ item.firstName }} {{ item.lastName }}
            <span class="mx-1 font-normal text-gray-400">·</span> {{ item.phone }}
          </p>
        </div>
        <p class="text-sm leading-relaxed text-gray-600">{{ item.street }}</p>
        <p class="text-sm leading-relaxed text-gray-600">{{ item.city }}, {{ item.county }}</p>
      </template>
    </AddressSelectorModal>

    <!-- Billing Selection Modal -->
    <AddressSelectorModal
      v-model:open="isBillingSelectorOpen"
      v-model:selected-id="selectedBillingId"
      title="Adresa de facturare (Companie)"
      :items="userBillingAddresses"
      empty-message="Nu ai nicio companie salvata in cont."
      @add-new="openNewBilling"
    >
      <template #item="{ item }">
        <div class="justify-starty flex items-center gap-2">
          <p class="mb-1 text-base font-bold text-gray-900 transition-colors">
            {{ item.companyName }}
          </p>
          <p class="text-sm leading-relaxed text-gray-600">
            · {{ item.hasRo ? 'RO' : '' }}{{ item.cui }}
          </p>
        </div>
        <p v-if="item.onrc" class="text-sm leading-relaxed text-gray-600">
          Reg. Com.: {{ item.onrc }}
        </p>
        <p class="text-sm leading-relaxed text-gray-600">{{ item.street }}</p>
        <p class="text-sm leading-relaxed text-gray-600">{{ item.city }}, {{ item.county }}</p>
      </template>
    </AddressSelectorModal>

    <!-- Individual billing address selector (Persoana fizica, alta adresa) -->
    <AddressSelectorModal
      v-model:open="isBillingAddressSelectorOpen"
      v-model:selected-id="selectedBillingAddressId"
      title="Adresa de facturare"
      :items="userAddresses"
      empty-message="Nu ai nicio adresa salvata in cont."
      @add-new="openNewBillingAddress"
    >
      <template #item="{ item }">
        <div class="flex items-start justify-between">
          <p class="mb-1 text-base font-bold text-gray-900 transition-colors">
            {{ item.firstName }} {{ item.lastName }}
            <span class="mx-1 font-normal text-gray-400">·</span> {{ item.phone }}
          </p>
        </div>
        <p class="text-sm leading-relaxed text-gray-600">{{ item.street }}</p>
        <p class="text-sm leading-relaxed text-gray-600">{{ item.city }}, {{ item.county }}</p>
      </template>
    </AddressSelectorModal>

    <!-- New Address Form Modal -->
    <UModal
      v-model:open="isNewAddressModalOpen"
      title="Adauga adresa noua"
      :ui="{ content: 'sm:max-w-xl' }"
      class="rounded-md"
    >
      <template #body>
        <AddressForm @saved="handleAddressSaved" />
      </template>
    </UModal>

    <!-- New Billing Form Modal -->
    <UModal
      v-model:open="isNewBillingModalOpen"
      title="Adauga persoana juridica"
      :ui="{ content: 'sm:max-w-xl' }"
      class="rounded-md"
    >
      <template #body>
        <BillingAddressForm @saved="handleBillingSaved" />
      </template>
    </UModal>
  </div>
</template>
