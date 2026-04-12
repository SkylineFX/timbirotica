<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

useHead({
  title: 'Contact',
  meta: [
    { name: 'description', content: 'Contacteaza echipa Eurotimalex. Vezi datele companiei, variantele de contact si programul de suport.' }
  ]
})

const schema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  email: z.email('Adresă de email invalidă'),
  subject: z.string().min(5, 'Subiectul trebuie să aibă cel puțin 5 caractere'),
  message: z.string().min(10, 'Mesajul trebuie să aibă cel puțin 10 caractere')
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const isLoading = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  isLoading.value = true
  submitStatus.value = 'idle'

  try {
    // Aici se poate adauga logica de trimitere a formularului (ex: fetch catre /api/contact)
    await new Promise(resolve => setTimeout(resolve, 1000))
    submitStatus.value = 'success'
    state.name = ''
    state.email = ''
    state.subject = ''
    state.message = ''
  } catch (err) {
    submitStatus.value = 'error'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 lg:py-12">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-3xl lg:text-4xl font-bold mb-4">Contactează-ne</h1>
      <p class="text-gray-600 max-w-2xl text-lg">Ai o întrebare sau ai nevoie de asistență? Suntem aici pentru a te ajuta. Completează formularul sau folosește detaliile de contact de mai jos.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      
      <!-- Stânga: Formular de contact -->
      <div class="lg:col-span-2 h-full flex flex-col">
        <UCard class="flex-1 flex flex-col" :ui="{ body: 'p-6 sm:p-8 flex-1 flex flex-col' }">
          <template #header>
            <h2 class="text-xl font-bold flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="w-6 h-6 text-primary" />
              Trimite-ne un mesaj
            </h2>
            <p class="text-sm text-gray-500 mt-1">Timp estimat de răspuns: 24h.</p>
          </template>

          <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-6 flex-1 flex flex-col">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UFormField label="Nume complet" name="name" required>
                <UInput v-model="state.name" placeholder="Popescu Ion" class="w-full" />
              </UFormField>
              <UFormField label="Adresă de email" name="email" required>
                <UInput v-model="state.email" type="email" placeholder="email@exemplu.ro" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Subiect" name="subject" required>
              <UInput v-model="state.subject" placeholder="Ex: Informații comandă #1234" class="w-full" />
            </UFormField>
            
            <div class="flex-1 flex flex-col">
              <UFormField label="Mesajul tău" name="message" required class="flex-1 flex flex-col" :ui="{ container: 'flex-1 mt-1 flex flex-col' }">
                <UTextarea v-model="state.message" :rows="6" placeholder="Cu ce te putem ajuta?" class="flex-1 flex flex-col w-full" :ui="{ base: 'flex-1 resize-none' }" />
              </UFormField>
            </div>

            <!-- Status mesaje -->
            <UAlert v-if="submitStatus === 'success'" icon="i-lucide-check-circle" color="primary" variant="soft" title="Mesaj trimis cu succes!" description="Îți vom răspunde în cel mai scurt timp posibil." />
            <UAlert v-if="submitStatus === 'error'" icon="i-lucide-alert-circle" color="error" variant="soft" title="A apărut o eroare" description="Te rugăm să încerci din nou mai târziu." />

            <div class="pt-2">
              <UButton type="submit" color="primary" size="lg" :loading="isLoading" block>
                Trimite mesajul
              </UButton>
            </div>
          </UForm>
        </UCard>
      </div>

      <!-- Dreapta: Informații -->
      <div class="space-y-6">
        
        <!-- Suport Clienti -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold flex items-center gap-2">
              <UIcon name="i-lucide-headset" class="w-5 h-5 text-primary" />
              Suport Clienți
            </h3>
          </template>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-phone" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium hover:text-primary transition-colors"><a href="tel:+40751022882">+40 751 022 882</a></p>
                <p class="text-sm text-gray-500">Luni - Vineri: 09:00 - 17:00</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-at-sign" class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium hover:text-primary transition-colors"><a href="mailto:eurotimalex@gmail.com">eurotimalex@gmail.com</a></p>
                <p class="text-sm text-gray-500">Răspuns în 24-48 ore lucrătoare</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Date Companie -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              Datele Companiei
            </h3>
          </template>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">Nume Brand</span>
              <span class="font-medium">Eurotimalex</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">Denumire Legală</span>
              <span class="font-medium text-right">EUROTIMALEX S.R.L.</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">CUI (VAT)</span>
              <span class="font-medium">RO18034200</span>
            </div>
            <div class="flex justify-between border-b border-gray-200 pb-2">
              <span class="text-gray-500">Nr. Înreg. (Reg. Com.)</span>
              <span class="font-medium">Jxx/xxxx/xxxx</span>
            </div>
            <div class="flex flex-col gap-1 border-b border-gray-200 pb-2">
              <span class="text-gray-500">Adresă Sediu Social</span>
              <span class="font-medium">Strada Drumul Tabrei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Țară Înregistrare</span>
              <span class="font-medium">România (EU)</span>
            </div>
          </div>
        </UCard>

        
      </div>
    </div>
  </UContainer>
</template>