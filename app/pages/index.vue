<script setup lang="ts">
useSeoMeta({
  title: "Articole de birotica si papetarie",
  ogTitle: "Timbirotica · Articole de birotica si papetarie",
});

const { data: categoryTree } = useFetch("/api/categories/tree");
const { data: brands } = useFetch("/api/brands");

const navigation = computed(() => [
  [
    {
      label: "Categorii produse",
      type: "link",
      to: "/c",
      class: "font-bold bg-primary/90 text-white rounded-t-md",
    },
    ...(categoryTree.value || []),
  ],
  [{ label: "Recomandate", to: "/produse-recomandate" }],
]);

const featuredCategories = [
  {
    title: "Produse recomandate",
    recommended: true,
  },
  {
    categoryId: 162,
  },
  {
    categoryId: 73,
  },
];
</script>

<template>
  <div>
    <UContainer
      class="my-6 grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4 items-stretch"
    >
      <div class="bg-white rounded-md hidden lg:block relative">
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
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 my-12">
        <NuxtLink
          to="/termeni-si-conditii#livrare"
          class="block h-full cursor-pointer"
        >
          <UCard class="h-full text-center rounded-sm">
            <UIcon name="i-lucide-truck" class="text-4xl text-primary mb-1" />
            <h3 class="font-bold pb-1">Livrare Gratuita</h3>
            <p class="text-sm text-gray-500">
              La comenzi >200 RON, la orice adresa din tara
            </p>
          </UCard>
        </NuxtLink>
        <NuxtLink
          to="/termeni-si-conditii#plata"
          class="block h-full cursor-pointer"
        >
          <UCard class="h-full text-center rounded-sm">
            <UIcon
              name="i-lucide-credit-card"
              class="text-4xl text-primary mb-1"
            />
            <h3 class="font-bold pb-1">Moduri de plata</h3>
            <p class="text-sm text-gray-500">
              Plata prin transfer bancar sau ramburs la livrare
            </p>
          </UCard>
        </NuxtLink>
        <NuxtLink to="/contact" class="block h-full cursor-pointer">
          <UCard class="h-full text-center rounded-sm">
            <UIcon name="i-lucide-info" class="text-4xl text-primary mb-1" />
            <h3 class="font-bold pb-1">Suport clienti</h3>
            <p class="text-sm text-gray-500">
              Ai o nelamurire?
              <span class="text-primary underline">Contacteaza-ne!</span>
            </p>
          </UCard>
        </NuxtLink>
        <NuxtLink
          to="/termeni-si-conditii#retur"
          class="block h-full cursor-pointer"
        >
          <UCard class="h-full text-center rounded-sm">
            <UIcon
              name="i-lucide-refresh-cw"
              class="text-4xl text-primary mb-1"
            />
            <h3 class="font-bold pb-1">Retur gratuit</h3>
            <p class="text-sm text-gray-500">
              In decursul a 14 zile de la primirea coletului
            </p>
          </UCard>
        </NuxtLink>
      </div>
    </UContainer>

    <UContainer class="my-6 lg:my-8 flex flex-col gap-8">
      <CategoryCarousel
        v-for="(carousel, index) in featuredCategories"
        :key="index"
        :title="carousel.title"
        :categoryId="carousel.categoryId"
        :recommended="carousel.recommended"
      />
    </UContainer>

    <UContainer class="my-6 lg:my-12 flex flex-col gap-4">
      <div
        class="flex items-center justify-between sm:justify-start items-baseline border-b border-gray-200 pb-1"
      >
        <h3 class="text-xl lg:text-2xl font-bold">Marci populare</h3>
        <UButton
          class="text-xs py-0 self-center"
          to="/producatori"
          color="primary"
          variant="link"
        >
          <span class="block sm:hidden">Vezi tot</span>
          <template #trailing>
            <UIcon
              name="i-lucide-arrow-right"
              class="w-4 sm:w-5 h-4 sm:h-5 mt-0 sm:mt-1"
            />
          </template>
        </UButton>
      </div>
      <BrandMarquee />
    </UContainer>
  </div>
</template>
