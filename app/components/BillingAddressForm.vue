<script setup lang="ts">
import { ref, watch } from 'vue'

const { address = null, isFirstAddress = false } = defineProps<{
  address?: any | null
  isFirstAddress?: boolean
}>()

const emit = defineEmits(['saved'])

const form = ref({
  companyName: '',
  cui: '',
  hasRo: 'RO',
  onrc: '',
  bankName: '',
  iban: '',
  county: 'București',
  city: '',
  street: '',
  isDefaultBilling: isFirstAddress
})

watch(() => address, (newAddr) => {
  if (newAddr) {
    form.value = {
      ...newAddr,
      isDefaultBilling: newAddr.isDefaultBilling ?? false
    }
  } else {
    form.value = {
      companyName: '',
      cui: '',
      hasRo: 'RO',
      onrc: '',
      bankName: '',
      iban: '',
      county: 'București',
      city: '',
      street: '',
      isDefaultBilling: isFirstAddress
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
  { label: 'RO', value: 'RO', selected: true },
  { label: '-', value: '-', selected: false }
]

async function submit() {
  if (!form.value.companyName || !form.value.cui || !form.value.onrc || !form.value.county || !form.value.city || !form.value.street) {
    toast.add({ title: 'Câmpuri obligatorii', description: 'Te rugăm să completezi toate câmpurile necesare pentru a adăuga compania.', color: 'error' })
    return
  }
  
  isLoading.value = true
  
  try {
    if (address?.id) {
      await $fetch(`/api/user/billing-addresses/${address.id}`, { method: 'PUT', body: form.value })
      toast.add({ title: 'Companie salvată', color: 'success' })
    } else {
      await $fetch('/api/user/billing-addresses', { method: 'POST', body: form.value })
      toast.add({ title: 'Companie adăugată cu succes', color: 'success' })
    }
    emit('saved')
  } catch(err: any) {
     toast.add({ title: 'Eroare la salvare', description: err.message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-6 px-2">
    <div>
      <h4 class="font-bold text-gray-900 mb-4 text-sm mt-2">Detalii companie</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Nume firmă" name="companyName" required>
           <UInput v-model="form.companyName" size="lg" class="w-full" required />
        </UFormField>
        <UFormField label="Cod unic de Înregistrare" name="cui" required>
           <div class="flex gap-2 w-full">
             <USelect v-model="form.hasRo" :items="hasRoOptions as any[]" value-attribute="value" option-attribute="label" size="lg" class="w-24 shrink-0" />
             <UInput v-model="form.cui" size="lg" class="w-full" required />
           </div>
        </UFormField>
        <UFormField label="Număr de înregistrare în Registrul Comerțului" name="onrc" class="sm:col-span-2" required>
           <UInput v-model="form.onrc" placeholder="ex: J40/1234/2024" size="lg" class="w-full" required />
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
          <UFormField label="Județ" name="county" required>
             <USelectMenu v-model="form.county" :items="countyNames" placeholder="Selectați" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Localitate" name="city" required>
             <USelectMenu v-model="form.city" :items="citiesData" placeholder="Selectați" size="lg" class="w-full" :disabled="!form.county || isFetchingCities" :loading="isFetchingCities" />
          </UFormField>
       </div>
       <div class="grid grid-cols-1 gap-4">
          <UFormField label="Adresa" name="street" required>
             <UInput v-model="form.street" placeholder="ex: Strada, număr, bloc, scara, etaj, apartament" size="lg" class="w-full" required />
          </UFormField>
       </div>
    </div>

    <div class="pt-2 flex flex-col gap-3">
         <UCheckbox v-model="form.isDefaultBilling" name="isDefaultBilling" label="Setează ca adresă implicită de facturare" />
    </div>

    <div class="pt-4 pb-2">
       <UButton type="submit" color="primary" block size="xl" class="rounded-md font-semibold justify-center" :loading="isLoading">Salvează</UButton>
    </div>
  </form>
</template>
