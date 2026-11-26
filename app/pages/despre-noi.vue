<script setup lang="ts">
useSeoMeta({
  title: 'Despre Noi',
  description: 'Informatii despre compania noastra, date de contact si obiect de activitate.',
  ogTitle: 'Despre Noi · Timbirotica',
  ogDescription: 'Informatii despre compania noastra, date de contact si obiect de activitate.'
})
</script>

<template>
  <UContainer class="max-w-5xl py-8 lg:py-12">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="mb-4 text-2xl font-bold lg:text-3xl">Despre Noi</h1>
      <p class="text-md max-w-2xl text-gray-600 lg:text-lg">
        Afla mai multe despre detaliile companiei.
      </p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-[15px] leading-relaxed text-gray-700 sm:text-base">
        <p>
          <strong class="font-semibold">Timbirotica</strong> este numele comercial al serviciului de
          comert electronic oferit de <strong class="font-semibold">Eurotimalex SRL</strong>, cu
          sediul social in Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6,
          Bucuresti, Romania, <strong class="font-semibold">CUI RO18034200</strong>, Nr.
          inregistrare <strong class="font-semibold">J2005017160400</strong>.
        </p>
        <p>
          <strong class="font-semibold">Timbirotica</strong> isi propune sa ofere clientilor din
          Romania produse de birotica si papetarie de inalta calitate la preturi competitive,
          sustinute de consultanta specializata si grija fata de client.
        </p>

        <div class="rounded-md border border-gray-100 bg-gray-50 p-4">
          <p class="mb-1 font-semibold text-gray-900">Obiect de activitate:</p>
          <p>
            <strong class="font-semibold">4791</strong> - Comert cu amanuntul prin intermediul
            caselor de comenzi sau prin Internet
          </p>
        </div>

        <div class="border-t border-gray-100 pt-4">
          <h3 class="mb-3 text-lg font-bold text-gray-900">Program si Contact</h3>
          <p class="mb-2">
            Preluam apeluri telefonice de luni pana vineri in intervalul orar:
            <strong class="font-semibold text-gray-900">09:00 - 18:00</strong>
          </p>
          <div class="mt-4 flex flex-col gap-2">
            <a
              href="tel:0751022882"
              class="flex w-max items-center gap-2 font-medium text-gray-900 transition-colors hover:text-primary"
            >
              <UIcon name="i-lucide-phone" class="h-4 w-4 text-gray-500" />
              0751 022 882
            </a>
            <a
              href="mailto:eurotimalex@yahoo.com"
              class="flex w-max items-center gap-2 font-medium text-gray-900 transition-colors hover:text-primary"
            >
              <UIcon name="i-lucide-mail" class="h-4 w-4 text-gray-500" />
              eurotimalex@yahoo.com
            </a>
          </div>
        </div>

        <div id="locatie" class="border-t border-gray-100 py-4 text-gray-700">
          <h3 class="mb-3 text-lg font-bold text-gray-900">Locatie & Activitate</h3>
          <p>Comenzile pot fi ridicate de la sediul nostru:</p>
          <div class="mt-6 flex flex-col items-start gap-6 lg:flex-row">
            <div class="flex-shrink-0 lg:w-1/3">
              <p class="leading-tight font-semibold text-gray-900">Eurotimalex S.R.L.</p>
              <p class="mt-1 text-gray-600">
                Strada Drumul Taberei Nr. 92<br />Bloc C7, Sc. F, Et. 4, Ap. 216<br />Sector 6,
                061406<br />Bucuresti, Romania
              </p>
            </div>

            <div
              class="h-64 w-full overflow-hidden rounded-sm border border-gray-200 sm:h-80 lg:w-2/3"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2849.7160194869502!2d26.016399476685354!3d44.41847277107616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b200464542ac57%3A0x35703c7ee2e04b3a!2sDrumul%20Taberei%2092%2C%20061406%20Bucure%C8%99ti!5e0!3m2!1sen!2sro!4v1776374742718!5m2!1sen!2sro"
                class="h-full w-full"
                style="border: 0"
                allowfullscreen="true"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              >
              </iframe>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row"
        >
          <p class="text-sm text-gray-500">Ai nevoie de mai multe informatii?</p>
          <UButton
            to="/contact"
            color="neutral"
            variant="solid"
            class="w-full justify-center rounded-sm bg-gray-900 px-5 py-2.5 font-bold text-white hover:bg-gray-800 sm:w-auto"
          >
            Formular de contact
          </UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
