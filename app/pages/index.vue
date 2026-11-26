<script setup lang="ts">
import { FREE_SHIPPING_THRESHOLD, RETURN_WINDOW_DAYS } from '~~/shared/constants/order'

useSeoMeta({
  title: 'Articole de birotica si papetarie',
  ogTitle: 'Timbirotica · Articole de birotica si papetarie'
})

const { data: categoryTree } = useCategoryTree()

const navigation = computed(() => [
  [
    {
      label: 'Categorii produse',
      type: 'link',
      to: '/c',
      class: 'font-bold bg-primary/90 text-white rounded-t-md'
    },
    ...(categoryTree.value || [])
  ],
  [{ label: 'Recomandate', to: '/produse-recomandate' }]
])

const featuredCategories = [
  {
    title: 'Produse recomandate',
    recommended: true
  },
  {
    categoryId: 162
  },
  {
    categoryId: 73
  }
]
</script>

<template>
  <div>
    <!-- The page's main title for screen readers and search engines, hidden
         so the design stays as it is. -->
    <h1 class="sr-only">Timbirotica · Articole de birotica si papetarie</h1>
    <UContainer
      class="my-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <div class="relative hidden rounded-md bg-white lg:block">
        <div class="absolute inset-0 overflow-y-auto">
          <UNavigationMenu
            :items="navigation"
            orientation="vertical"
            type="single"
            class="w-full"
          />
        </div>
      </div>
      <HeroCarousel class="w-full min-w-0" />
    </UContainer>

    <UContainer class="my-6">
      <div class="my-12 grid grid-cols-2 gap-2 md:grid-cols-4">
        <NuxtLink to="/termeni-si-conditii#livrare" class="block h-full cursor-pointer">
          <UCard class="h-full rounded-sm text-center">
            <UIcon name="i-lucide-truck" class="mb-1 text-4xl text-primary" />
            <h3 class="pb-1 font-bold">Livrare Gratuita</h3>
            <p class="text-sm text-gray-500">
              La comenzi de minimum {{ FREE_SHIPPING_THRESHOLD }} RON, oriunde in tara
            </p>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/termeni-si-conditii#plata" class="block h-full cursor-pointer">
          <UCard class="h-full rounded-sm text-center">
            <UIcon name="i-lucide-credit-card" class="mb-1 text-4xl text-primary" />
            <h3 class="pb-1 font-bold">Moduri de plata</h3>
            <p class="text-sm text-gray-500">
              Plata prin transfer bancar, pe baza facturii proforme
            </p>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/contact" class="block h-full cursor-pointer">
          <UCard class="h-full rounded-sm text-center">
            <UIcon name="i-lucide-info" class="mb-1 text-4xl text-primary" />
            <h3 class="pb-1 font-bold">Suport clienti</h3>
            <p class="text-sm text-gray-500">
              Ai o nelamurire?
              <span class="text-primary underline">Contacteaza-ne!</span>
            </p>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/termeni-si-conditii#retur" class="block h-full cursor-pointer">
          <UCard class="h-full rounded-sm text-center">
            <UIcon name="i-lucide-refresh-cw" class="mb-1 text-4xl text-primary" />
            <h3 class="pb-1 font-bold">Retur</h3>
            <p class="text-sm text-gray-500">
              In decursul a {{ RETURN_WINDOW_DAYS }} zile de la primirea coletului
            </p>
          </UCard>
        </NuxtLink>
      </div>
    </UContainer>

    <UContainer class="my-6 flex flex-col gap-8 lg:my-8">
      <CategoryCarousel
        v-for="(carousel, index) in featuredCategories"
        :key="index"
        :title="carousel.title"
        :category-id="carousel.categoryId"
        :recommended="carousel.recommended"
      />
    </UContainer>

    <UContainer class="my-6 flex flex-col gap-4 lg:my-12">
      <div
        class="flex items-baseline items-center justify-between border-b border-gray-200 pb-1 sm:justify-start"
      >
        <h3 class="text-xl font-bold lg:text-2xl">Marci populare</h3>
        <UButton
          class="self-center py-0 text-xs"
          to="/producatori"
          aria-label="Vezi tot: Marci populare"
          color="primary"
          variant="link"
        >
          <span class="block sm:hidden">Vezi tot</span>
          <template #trailing>
            <UIcon name="i-lucide-arrow-right" class="mt-0 h-4 w-4 sm:mt-1 sm:h-5 sm:w-5" />
          </template>
        </UButton>
      </div>
      <BrandMarquee />
    </UContainer>
  </div>
</template>
