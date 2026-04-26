<script setup lang="ts">
import { ref, watch } from 'vue'
import { vMaska } from 'maska/vue'

const { address = null, isFirstAddress = false } = defineProps<{
  address?: any | null
  isFirstAddress?: boolean
}>()

const emit = defineEmits(['saved'])

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  county: 'București',
  city: '',
  street: '',
  postalCode: '',
  isDefaultShipping: isFirstAddress
})

watch(() => address, (newAddr) => {
  if (newAddr) {
    form.value = {
      ...newAddr,
      phone: newAddr.phone ? newAddr.phone.replace(/^\+40/, '').replace(/\s+/g, '') : '',
      postalCode: newAddr.postalCode || '',
      isDefaultShipping: newAddr.isDefaultShipping ?? false
    }
  } else {
    form.value = {
      firstName: '',
      lastName: '',
      phone: '',
      county: 'București',
      city: '',
      street: '',
      postalCode: '',
      isDefaultShipping: isFirstAddress
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

async function submit() {
  if (!form.value.firstName || !form.value.lastName || !form.value.phone || !form.value.county || !form.value.city || !form.value.street || !form.value.postalCode) {
    toast.add({ title: 'Campuri obligatorii', description: 'Te rugam sa completezi toate campurile pentru a putea adauga adresa.', color: 'error' })
    return
  }
  
  isLoading.value = true
  
  const payload = {
    ...form.value,
    phone: '+40' + form.value.phone.replace(/\s+/g, '')
  }

  try {
    if (address?.id) {
      await $fetch(`/api/user/addresses/${address.id}`, { method: 'PUT', body: payload })
      toast.add({ title: 'Adresa salvata', color: 'success' })
    } else {
      await $fetch('/api/user/addresses', { method: 'POST', body: payload })
      toast.add({ title: 'Adresa adaugata cu succes', color: 'success' })
    }
    emit('saved')
  } catch(err: any) {
     toast.add({ title: 'Eroare la salvarea adresei', description: err.message, color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-6 px-2">
    <div>
      <h4 class="font-bold text-gray-900 mb-4 text-sm mt-2">Persoana de contact</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Prenume" name="firstName" required>
           <UInput v-model="form.firstName" size="lg" class="w-full" required />
        </UFormField>
        <UFormField label="Nume" name="lastName" required>
           <UInput v-model="form.lastName" size="lg" class="w-full" required />
        </UFormField>
        <UFormField label="Numar de telefon" name="phone" class="sm:col-span-2" required>
           <UInput v-model="form.phone" v-maska="'### ### ###'" size="lg" class="w-full" type="tel" required :ui="{base: 'ps-11'}">
            <template #leading>
               <span class="text-gray-500">+40</span>
            </template>
           </UInput>
        </UFormField>
      </div>
    </div>

    <div>
       <h4 class="font-bold text-gray-900 mb-4 text-sm mt-4">Detalii adresa</h4>
       <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <UFormField label="Judet" name="county" required>
             <USelectMenu v-model="form.county" :items="countyNames" placeholder="Selectati" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Localitate" name="city" required>
             <USelectMenu v-model="form.city" :items="citiesData" placeholder="Selectati" size="lg" class="w-full" :disabled="!form.county || isFetchingCities" :loading="isFetchingCities" />
          </UFormField>
       </div>
        <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <UFormField label="Adresa" name="street" required>
             <UInput v-model="form.street" placeholder="Strada, numar, bloc, scara, etaj, apartament" size="lg" class="w-full" required :ui="{base: 'text-sm'}" />
          </UFormField>
          <UFormField label="Cod Postal" name="postalCode" required>
             <UInput v-model="form.postalCode" size="lg" class="w-full" required />
          </UFormField>
       </div>
    </div>

    <div class="pt-2 flex flex-col gap-3">
         <UCheckbox v-model="form.isDefaultShipping" name="isDefaultShipping" label="Seteaza ca adresa implicita de livrare" />
    </div>

    <div class="pt-4 pb-2">
       <UButton type="submit" color="primary" block size="xl" class="rounded-md font-semibold justify-center" :loading="isLoading">Salveaza</UButton>
    </div>
  </form>
</template>
