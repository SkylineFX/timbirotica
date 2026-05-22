<script setup lang="ts">
useHead({
  title: 'Despre Noi',
  meta: [
    { name: 'description', content: 'Informatii despre compania noastra, date de contact si obiect de activitate.' }
  ]
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-2xl lg:text-3xl font-bold mb-4">Despre Noi</h1>
      <p class="text-gray-600 max-w-2xl text-md lg:text-lg">Afla mai multe despre detaliile companiei.</p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-gray-700 leading-relaxed text-[15px] sm:text-base">
        
        <p><strong class="font-semibold">Timbirotica</strong> este numele comercial al serviciului de comert electronic oferit de <strong class="font-semibold">Eurotimalex SRL</strong>, cu sediul social in Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, Bucuresti, Romania, <strong class="font-semibold">CUI RO18034200</strong>, Nr. inregistrare <strong class="font-semibold">J40/17160/2005</strong>.</p>
        <p><strong class="font-semibold">Timbirotica</strong> isi propune sa ofere clientilor din Romania produse de birotica si papetarie de inalta calitate la preturi competitive, sustinute de consultanta specializata si grija fata de client.</p>

        <div class="p-4 bg-gray-50 rounded-md border border-gray-100">
          <p class="font-semibold text-gray-900 mb-1">Obiect de activitate:</p>
          <p><strong class="font-semibold">4791</strong> - Comert cu amanuntul prin intermediul caselor de comenzi sau prin Internet</p>
        </div>

        
        <div class="pt-4 border-t border-gray-100">
          <h3 class="font-bold text-gray-900 mb-3 text-lg">Program si Contact</h3>
          <p class="mb-2">Preluam apeluri telefonice de luni pana vineri in intervalul orar: <strong class="font-semibold text-gray-900">09:00 - 18:00</strong></p>
          <div class="flex flex-col gap-2 mt-4">
            <a href="tel:+40751022882" class="flex items-center gap-2 text-gray-900 hover:text-primary transition-colors font-medium w-max">
              <UIcon name="i-lucide-phone" class="w-4 h-4 text-gray-500" />
              +40 751 022 882
            </a>
            <a href="mailto:eurotimalex@yahoo.com" class="flex items-center gap-2 text-gray-900 hover:text-primary transition-colors font-medium w-max">
              <UIcon name="i-lucide-mail" class="w-4 h-4 text-gray-500" />
              eurotimalex@yahoo.com
            </a>
          </div>
        </div>

        <div class="py-4 border-t border-gray-100 text-gray-700" id="locatie">
          <h3 class="font-bold text-gray-900 mb-3 text-lg">Locatie & Activitate</h3>
          <p>Comenzile pot fi ridicate de la sediul nostru central:</p>
          <div class="mt-6 flex flex-col lg:flex-row gap-6 items-start">
            <div class="flex-shrink-0 lg:w-1/3">
               <p class="font-semibold text-gray-900 leading-tight">Eurotimalex S.R.L.</p>
               <p class="text-gray-600 mt-1">Strada Drumul Taberei Nr. 92<br/>Bloc C7, Sc. F, Et. 4, Ap. 216<br/>Sector 6, 061406<br/>Bucuresti, Romania</p>
            </div>
            
            <div class="w-full lg:w-2/3 h-64 sm:h-80 rounded-sm overflow-hidden border border-gray-200">
               <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2849.7160194869502!2d26.016399476685354!3d44.41847277107616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b200464542ac57%3A0x35703c7ee2e04b3a!2sDrumul%20Taberei%2092%2C%20061406%20Bucure%C8%99ti!5e0!3m2!1sen!2sro!4v1776374742718!5m2!1sen!2sro" 
                  class="w-full h-full" 
                  style="border:0;" 
                  allowfullscreen="true" 
                  loading="lazy" 
                  referrerpolicy="no-referrer-when-downgrade">
               </iframe>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">Ai nevoie de mai multe informatii?</p>
          <UButton to="/contact" color="neutral" variant="solid" class="rounded-sm font-bold px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto justify-center">
            Formular de contact
          </UButton>
        </div>

      </div>
    </UCard>
  </UContainer>
</template>
