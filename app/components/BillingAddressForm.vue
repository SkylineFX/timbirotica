<script setup lang="ts">
import { ref, watch } from 'vue'
import { vMaska } from 'maska/vue'
import { billingAddressSchema, type BillingAddress } from '~~/shared/schemas/billingAddress'
import type { FormSubmitEvent } from '@nuxt/ui'

const { address = null, isFirstAddress = false } = defineProps<{
  address?: any | null
  isFirstAddress?: boolean
}>()

const emit = defineEmits(['saved'])

const form = ref<Partial<BillingAddress>>({
  companyName: '',
  cui: '',
  hasRo: true,
  onrc: '',
  bankName: '',
  iban: '',
  phone: '',
  county: 'București',
  city: '',
  street: '',
  isDefaultBilling: true
})

// Account holder's saved phone — used to prefill the contact phone on a new
// billing record. Existing records may also lack a phone (legacy rows pre-dating
// the column), in which case we prefill from the account here as well.
const { data: userProfile } = await useFetch('/api/user')

watch(() => address, (newAddr) => {
  if (newAddr) {
    form.value = {
      ...newAddr,
      hasRo: newAddr.hasRo ?? true,
      phone: newAddr.phone || userProfile.value?.phone || '',
      isDefaultBilling: newAddr.isDefaultBilling ?? false
    }
  } else {
    form.value = {
      companyName: '',
      cui: '',
      hasRo: true,
      onrc: '',
      bankName: '',
      iban: '',
      phone: userProfile.value?.phone || '',
      county: '',
      city: '',
      street: '',
      isDefaultBilling: true
    }
  }
}, { immediate: true })

const { data: countiesData } = await useFetch('/api/locations/counties')
const countyNames = computed(() => (countiesData.value as any[])?.map(c => c.name) || [])
const citiesData = ref<string[]>([])
const isFetchingCities = ref(false)

const loadCities = async (countyName: string) => {
  if (!countyName) {
    citiesData.value = []
    return
  }
  isFetchingCities.value = true
  try {
    const res = await ($fetch as any)('/api/locations/cities', { params: { countyName } })
    citiesData.value = res.map((c: any) => c.name)
  } catch (e) {
    console.error('Failed to load cities', e)
  } finally {
    isFetchingCities.value = false
  }
}

watch(() => form.value.county, (newCounty, oldCounty) => {
  if (newCounty !== oldCounty && oldCounty !== undefined) {
    form.value.city = ''
  }
  if (newCounty) {
    loadCities(newCounty)
  }
})

const isLoading = ref(false)
const toast = useToast()

const hasRoOptions = [
  { label: 'RO', value: true },
  { label: '-', value: false }
]

async function submit(event: FormSubmitEvent<BillingAddress>) {
  isLoading.value = true

  try {
    if (address?.id) {
      await $fetch(`/api/user/billing-addresses/${address.id}`, { method: 'PUT', body: event.data })
      toast.add({ title: 'Companie salvata', color: 'success' })
    } else {
      await $fetch('/api/user/billing-addresses', { method: 'POST', body: event.data })
      toast.add({ title: 'Companie adaugata cu succes', color: 'success' })
    }
    emit('saved')
  } catch(err: any) {
     toast.add({ title: 'Eroare la salvare', description: err?.data?.message ?? err.message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UForm :schema="billingAddressSchema" :state="form" class="space-y-6 px-2" @submit="submit">
    <div>
      <h4 class="font-bold text-gray-900 mb-4 text-sm mt-2">Detalii companie</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Nume firma" name="companyName" required>
           <UInput v-model="form.companyName" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Cod unic de Inregistrare" name="cui" required>
           <div class="flex gap-2 w-full">
             <USelect v-model="form.hasRo" :items="hasRoOptions as any[]" value-attribute="value" option-attribute="label" size="lg" class="w-24 shrink-0" />
             <UInput v-model="form.cui" size="lg" class="w-full" />
           </div>
        </UFormField>
        <UFormField label="Numar de inregistrare in Registrul Comertului" name="onrc" class="sm:col-span-2">
           <UInput v-model="form.onrc" placeholder="ex: J40/1234/2024" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Banca" name="bankName">
           <UInput v-model="form.bankName" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Cont IBAN" name="iban">
           <UInput v-model="form.iban" size="lg" class="w-full" />
        </UFormField>
      </div>
    </div>

    <div>
       <h4 class="font-bold text-gray-900 mb-4 text-sm mt-4">Sediu social</h4>
       <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <UFormField label="Judet" name="county" required>
             <USelectMenu v-model="form.county" :items="countyNames" placeholder="Selectati" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Localitate" name="city" required>
             <USelectMenu v-model="form.city" :items="citiesData" placeholder="Selectati" size="lg" class="w-full" :disabled="!form.county || isFetchingCities" :loading="isFetchingCities" />
          </UFormField>
       </div>
       <div class="grid grid-cols-1 gap-4">
          <UFormField label="Adresa" name="street" required>
             <UInput v-model="form.street" placeholder="ex: Strada, numar, bloc, scara, etaj, apartament" size="lg" class="w-full" />
          </UFormField>
       </div>
    </div>

    <div>
       <h4 class="font-bold text-gray-900 mb-4 text-sm mt-4">Contact</h4>
       <UFormField label="Numar de telefon" name="phone" required>
          <UInput v-model="form.phone" v-maska="'#### ### ###'" placeholder="07XX XXX XXX" type="tel" autocomplete="tel" size="lg" class="w-full" />
       </UFormField>
    </div>

    <div class="pt-2 flex flex-col gap-3">
         <UCheckbox v-model="form.isDefaultBilling" name="isDefaultBilling" label="Seteaza ca adresa implicita de facturare" />
    </div>

    <div class="pt-4 pb-2">
       <UButton type="submit" color="primary" block size="xl" class="rounded-md font-semibold justify-center" :loading="isLoading">Salveaza</UButton>
    </div>
  </UForm>
</template>
