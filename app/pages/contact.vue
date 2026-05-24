<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

useHead({
  title: 'Contact',
  meta: [
    { name: 'description', content: 'Contacteaza echipa Timbirotica. Vezi datele companiei, variantele de contact si programul de suport.' }
  ]
})

const schema = z.object({
  name: z.string().min(2, 'Numele trebuie sa aiba cel putin 2 caractere'),
  email: z.email('Adresa de email invalida'),
  subject: z.string().min(5, 'Subiectul trebuie sa aiba cel putin 5 caractere'),
  message: z.string().min(10, 'Mesajul trebuie sa aiba cel putin 10 caractere')
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const toast = useToast()
const isLoading = ref(false)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  isLoading.value = true

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: event.data
    })
    toast.add({
      title: 'Mesaj trimis cu succes!',
      description: 'Iti vom raspunde in cel mai scurt timp posibil.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    state.name = ''
    state.email = ''
    state.subject = ''
    state.message = ''
  } catch (err) {
    toast.add({
      title: 'A aparut o eroare',
      description: 'Te rugam sa incerci din nou mai tarziu.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 lg:py-12">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-3xl lg:text-3xl font-bold mb-2 md:mb-4">Contacteaza-ne</h1>
      <p class="text-gray-600 max-w-2xl text-md lg:text-lg">Ai o intrebare sau ai nevoie de asistenta? <br/> Completeaza formularul sau foloseste detaliile de contact de mai jos.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      
      <!-- Stanga: Formular de contact -->
      <div class="lg:col-span-2 h-full flex flex-col">
        <UCard class="flex-1 flex flex-col" :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8 flex-1 flex flex-col' }">
          <template #header>
            <h2 class="text-xl font-bold flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="w-6 h-6 text-primary" />
              Trimite-ne un mesaj
            </h2>
            <p class="text-sm text-gray-500 mt-1">Timp estimat de raspuns: 24h.</p>
          </template>

          <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-6 flex-1 flex flex-col">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UFormField label="Nume complet" name="name" required>
                <UInput v-model="state.name" placeholder="Popescu Ion" class="w-full" />
              </UFormField>
              <UFormField label="Adresa de email" name="email" required>
                <UInput v-model="state.email" type="email" placeholder="email@exemplu.ro" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Subiect" name="subject" required>
              <UInput v-model="state.subject" placeholder="Ex: Informatii comanda #1234" class="w-full" />
            </UFormField>
            
            <div class="flex-1 flex flex-col">
              <UFormField label="Mesajul tau" name="message" required class="flex-1 flex flex-col" :ui="{ container: 'flex-1 mt-1 flex flex-col' }">
                <UTextarea v-model="state.message" :rows="6" placeholder="Cu ce te putem ajuta?" class="flex-1 flex flex-col w-full" :ui="{ base: 'flex-1 resize-none' }" />
              </UFormField>
            </div>

            <div class="pt-2">
              <UButton type="submit" color="primary" size="lg" :loading="isLoading" block>
                Trimite mesajul
              </UButton>
            </div>
          </UForm>
        </UCard>
      </div>

      <!-- Dreapta: Informatii -->
      <div class="space-y-6">
        
        <!-- Suport Clienti -->
        <UCard :ui="{ root: 'rounded-md' }">
          <template #header>
            <h3 class="text-lg font-bold flex items-center gap-2">
              <UIcon name="i-lucide-headset" class="w-5 h-5 text-primary" />
              Suport Clienti
            </h3>
          </template>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-phone" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium hover:text-primary transition-colors"><a href="tel:0751022882">0751 022 882</a></p>
                <p class="text-sm text-gray-500">Luni - Vineri: 09:00 - 18:00</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-at-sign" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium hover:text-primary transition-colors"><a href="mailto:eurotimalex@yahoo.com">eurotimalex@yahoo.com</a></p>
                <p class="text-sm text-gray-500">Raspuns in 24-48 ore lucratoare</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Date Companie -->
        <UCard :ui="{ root: 'rounded-md' }">
          <template #header>
            <h3 class="text-lg font-bold flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              Datele Companiei
            </h3>
          </template>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">Nume Brand</span>
              <span class="font-medium">Timbirotica</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">Denumire Legala</span>
              <span class="font-medium text-right">EUROTIMALEX S.R.L.</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">CUI</span>
              <span class="font-medium">RO18034200</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">Registrul Comertului</span>
              <span class="font-medium">J40/17160/2005</span>
            </div>
            <div class="flex flex-col gap-1 border-b border-gray-200 pb-2">
              <span class="text-gray-500">Adresa Sediu Social</span>
              <span class="font-medium">Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, Bucuresti</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Tara Inregistrare</span>
              <span class="font-medium">Romania</span>
            </div>
          </div>
        </UCard>

        
      </div>
    </div>
  </UContainer>
</template>