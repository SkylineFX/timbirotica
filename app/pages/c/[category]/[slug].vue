<script setup lang="ts">
import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'
import { absoluteUrl, canonicalUrl, jsonLd, productStructuredData } from '~~/shared/utils/seo'

const route = useRoute()
const slug = route.params.slug as string

const { data: product } = await useFetch(`/api/products/${slug}`)

if (!product.value) {
  throw createError({ statusCode: 404, message: 'Product not found' })
}

// A product has one address, /c/<its category>/<slug>, the one the links and
// the sitemap use. Any other category in the path moves there for good (301).
const productCategory = product.value.category?.slug ?? 'toate'
const isWrongCategory = route.params.category !== productCategory
if (isWrongCategory) {
  const productPage = { path: `/c/${productCategory}/${product.value.slug}`, query: route.query, hash: route.hash }
  // The server answers with the redirect. In the browser it isn't awaited: the
  // rest of this setup reads the product, which is gone once the navigation
  // has replaced this page.
  if (import.meta.server) await navigateTo(productPage, { redirectCode: 301 })
  else navigateTo(productPage, { replace: true })
}

const config = useRuntimeConfig()
const truncate = (s: string | undefined | null, n = 155) =>
  s ? (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s) : undefined

const pageTitle = product.value.category?.name
  ? `${product.value.category.name} / ${product.value.name}`
  : product.value.name
const pageDescription = truncate(product.value.description)
const productImage = product.value.images?.[0]
const absoluteImage = productImage ? absoluteUrl(config.public.siteUrl, productImage) : undefined

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  ogImage: absoluteImage,
  twitterCard: absoluteImage ? 'summary_large_image' : 'summary',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: absoluteImage
})

// Product data for search results: name, photos, brand, price and stock.
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: jsonLd(productStructuredData(product.value, {
      url: canonicalUrl(config.public.siteUrl, `/c/${productCategory}/${product.value.slug}`),
      siteUrl: config.public.siteUrl
    }))
  }]
})

const breadcrumbs = computed(() => {
  if (!product.value) return []
  return [
    { label: 'Acasa', to: '/' },
    { label: product.value.category?.name || 'Categorii', to: `/c/${product.value.category?.slug}` },
    { label: product.value.name, to: route.path }
  ]
})

const quantity = ref(1)

const stockColor = computed(() => {
    const status = product.value?.description?.toLowerCase() || ''
    if (status.includes('limitat')) return 'text-orange-600 dark:text-orange-500'
    if (status.includes('epuizat') || status.includes('indisponibil')) return 'text-red-600 dark:text-red-500'
    return 'text-green-600 dark:text-green-500'
})

const { addToCart } = useCart()

const { favorites, addToFavorites, removeFromFavorites } = useFavorites()
const isFavorite = computed(() => favorites.value.some((f: any) => f.productId === product.value?.id))

const toggleFavorite = async () => {
    if (isFavorite.value) {
        const fav = favorites.value.find((f: any) => f.productId === product.value?.id)
        if (fav) await removeFromFavorites(fav.id)
    } else if (product.value) {
        await addToFavorites(product.value)
    }
}

const accordionItems = [
  {
    label: 'Livrare',
    icon: 'i-lucide-truck',
    text: 'Livrarea se face in 24-48 de ore de la confirmarea comenzii. Costul transportului este de 30 RON pentru comenzile sub 200 RON. Afla mai multe detalii:',
    link: { to: '/termeni-si-conditii#livrare', label: 'Livrare' },
  },
  {
    label: 'Retur',
    icon: 'i-lucide-rotate-ccw',
    text: 'Ai la dispozitie 14 zile calendaristice pentru a returna produsul. Acesta trebuie sa fie in aceeasi stare in care a fost livrat, in ambalajul original. Afla mai multe detalii:',
    link: { to: '/termeni-si-conditii#retur', label: 'Retur' },
  }
]
</script>

<template>
  <UContainer class="py-6">
    <UBreadcrumb :items="breadcrumbs" :ui="{ separatorIcon: 'w-4 h-4' }" class="mb-6 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_li]:shrink-0 [&_li:last-child]:shrink-1 [&_li:last-child]:min-w-0" />
    <!-- One header for every screen size, so the page has a single h1: above
         the photos on phones, beside them from md up (grid placement). -->
    <div v-if="product" class="grid grid-cols-1 md:grid-cols-12 md:grid-rows-[auto_1fr] md:gap-x-12">
        <div class="mb-6 md:mb-0 md:col-start-8 md:col-span-5 md:row-start-1">
            <!-- Brand container, phones -->
            <div v-if="product.brand" class="md:hidden mb-2 dark:bg-gray-900 p-1 rounded-md border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <NuxtLink :to="`/producatori/${product.brand.slug}`" class="text-xs text-gray-500 underline hover:text-primary transition-colors">
                    <NuxtImg v-if="product.brand.image" :src="product.brand.image" :alt="product.brand.name" class="h-4 object-contain" />
                    <span v-else class="font-bold text-gray-900 border-gray-100 dark:text-white">{{ product.brand.name }}</span>
                </NuxtLink>
            </div>
            <!-- Brand container, wider screens -->
            <div v-if="product.brand" class="hidden mb-6 bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-800 md:flex items-center justify-between">
                <NuxtImg v-if="product.brand.image" :src="product.brand.image" :alt="product.brand.name" class="h-6 object-contain" />
                <span v-else class="font-bold text-gray-900 border-gray-100 dark:text-white">{{ product.brand.name }}</span>
                <NuxtLink :to="`/producatori/${product.brand.slug}`" class="text-xs text-gray-500 underline hover:text-primary transition-colors">Vezi toate produsele</NuxtLink>
            </div>

            <!-- Title -->
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight"> <!-- lowercase first-letter:uppercase-->
                {{ product.name }}
            </h1>

            <!-- SKU / Code -->
            <p class="text-sm text-gray-500 mb-0 md:mb-6 font-mono">
                Cod produs: {{ product.sku}}
            </p>
        </div>

        <div class="w-full mb-8 md:mb-0 md:col-start-1 md:col-span-7 md:row-start-1 md:row-span-2">
            <ProductCarousel :productImages="product.images || []"/>
        </div>

        <div class="w-full md:col-start-8 md:col-span-5 md:row-start-2">
            <div class="flex flex-col h-full md:pb-[0px]">
                <!-- Stock Status -->
                <div class="flex items-center gap-2 mb-2 font-medium" :class="stockColor">
                    <UBadge v-if="product.stock > 0" color="success" variant="soft" class="rounded-sm" leading-icon="i-lucide-check">Disponibil</UBadge>
                    <UBadge v-else color="error" variant="soft" class="rounded-sm" leading-icon="i-lucide-x">Indisponibil</UBadge>
                </div>

                <!-- Price -->
                <div class="flex flex-col gap-0 mb-6">
                    <p class="text-3xl lg:text-3xl font-bold text-gray-900">
                        <span class="text-3xl lg:text-3xl">{{ product.price.toFixed(2).split('.')[0] }}</span>
                        <span class="text-sm align-top">{{ product.price.toFixed(2).split('.')[1] }}</span>
                        <span class="text-md ml-2">RON</span>
                    </p>
                    <span class="text-xs text-gray-500">Pretul include TVA</span>
                </div>

                <!-- Actions -->
                <div class="flex flex-col items-start gap-3 mb-6 w-full max-w-md">
                    <div class="flex items-center gap-2">
                        <p>Cantitate:</p>
                        <UInputNumber
                            v-model="quantity" 
                            :min="1"
                            :max="CART_MAX_QUANTITY"
                            class="w-24"
                            size="xs"
                        />
                    </div>
                    <div class="flex gap-2 w-full">
                        <UButton
                            block
                            class="flex-1 rounded-sm"
                            color="primary"
                            variant="subtle"
                            icon="i-lucide-shopping-cart"
                            :disabled="product.stock === 0"
                            @click="addToCart(product, quantity)"
                        >
                            Adauga in cos
                        </UButton>
                        <UButton 
                            size="xl" 
                            :color="isFavorite ? 'primary' : 'neutral'" 
                            :variant="isFavorite ? 'solid' : 'subtle'" 
                            class="rounded-sm"
                            icon="i-lucide-heart"
                            :aria-label="isFavorite ? 'Sterge de la favorite' : 'Adauga la favorite'"
                            @click.prevent="toggleFavorite"
                        />
                    </div>
                    <USeparator label="sau" class="text-gray-500"/>
                    <div class="flex-1 items-center">
                        <div class="flex items-start gap-3 rounded-sm bg-white border border-gray-200 px-4 py-3">
                            <UIcon name="i-lucide-phone-call" class="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div class="text-sm">
                                <span class="text-gray-500">Comanda telefonic: </span>
                                <a href="tel:0751022882" class="ml-1 font-bold text-gray-900 hover:text-primary transition-colors">0751 022 882</a>
                                <span class="block text-xs text-gray-400 mt-0.5">Luni - Vineri · 09:00 - 18:00</span>
                            </div>
                        </div>

                    </div>
                </div>
                
                <!-- Additional Info -->
                <div class="mt-auto w-full">
                    <UAccordion :items="accordionItems" color="primary" variant="soft" size="md" default-value="0">
                        <template #body="{ item }">
                            {{ item.text }}
                            <NuxtLink :to="item.link.to" class="underline text-primary">{{ item.link.label }}</NuxtLink>.
                        </template>
                    </UAccordion>
                </div>
            </div>
        </div>
    </div>

    <!-- Description Container -->
    <div v-if="product && product.description" class="mt-8 md:mt-12 md:pt-4 flex flex-col gap-4">
        <h2 class="text-xl lg:text-2xl font-bold items-baseline border-b border-gray-200 pb-1">Descriere produs</h2>
        <div class="prose dark:prose-invert text-gray-600 dark:text-gray-300 max-w-none">
            <p>{{ product.description }}</p>
        </div>
    </div>

    <!-- Not while redirecting: the server renders the page before it sends the
         301, and the carousel would query the database for nothing. -->
    <div class="mt-12" v-if="product?.categoryId && !isWrongCategory">
        <CategoryCarousel 
            title="Produse similare" 
            :categoryId="product?.categoryId"
        />
    </div>
  </UContainer>
</template>
