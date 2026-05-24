<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data: product } = await useFetch(`/api/products/${slug}`)

if (!product.value) {
  throw createError({ statusCode: 404, message: 'Product not found' })
}

const site = useSiteConfig()
const truncate = (s: string | undefined | null, n = 155) =>
  s ? (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s) : undefined

const pageTitle = product.value.category?.name
  ? `${product.value.category.name} / ${product.value.name}`
  : product.value.name
const pageDescription = truncate(product.value.description)
const productImage = product.value.images?.[0]
const absoluteImage = productImage
  ? (productImage.startsWith('http') ? productImage : `${site.url}${productImage}`)
  : undefined

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
    text: 'Livrarea se face doar in Bucuresti si Ilfov, in 24-48 de ore de la confirmarea comenzii. Costul transportului este de 30 RON pentru comenzile sub 200 RON. Afla mai multe detalii:',
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
    <div v-if="product" class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <div class="w-full md:col-span-7">
            <!-- Mobile Header (hidden on desktop) -->
            <div class="block md:hidden mb-6">
                <!-- Brand container -->
                <div v-if="product.brand" class="mb-2 dark:bg-gray-900 p-1 rounded-md border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <NuxtLink :to="`/producatori/${product.brand.slug}`" class="text-xs text-gray-500 underline hover:text-primary transition-colors">
                        <NuxtImg v-if="product.brand.image" :src="product.brand.image" :alt="product.brand.name" class="h-4 object-contain" />
                        <span v-else class="font-bold text-gray-900 border-gray-100 dark:text-white">{{ product.brand.name }}</span>
                    </NuxtLink>
                </div>

                <!-- Title -->
                <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight"> <!-- lowercase first-letter:uppercase-->
                    {{ product.name }}
                </h1>
                
                <!-- SKU / Code -->
                <p class="text-sm text-gray-500 mb-0 font-mono">
                    Cod produs: {{ product.sku}}
                </p>
            </div>
            
            <ProductCarousel :productImages="product.images || []"/>
        </div>

        <div class="w-full md:col-span-5">
            <div class="flex flex-col h-full md:pb-[0px]">
                <!-- Desktop Header (hidden on mobile) -->
                <div class="hidden md:block">
                    <!-- Brand container -->
                    <div v-if="product.brand" class="mb-6 bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <NuxtImg v-if="product.brand.image" :src="product.brand.image" :alt="product.brand.name" class="h-6 object-contain" />
                        <span v-else class="font-bold text-gray-900 border-gray-100 dark:text-white">{{ product.brand.name }}</span>
                        <NuxtLink :to="`/producatori/${product.brand.slug}`" class="text-xs text-gray-500 underline hover:text-primary transition-colors">Vezi toate produsele</NuxtLink>
                    </div>

                    <!-- Title -->
                    <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight"> <!-- lowercase first-letter:uppercase-->
                        {{ product.name }}
                    </h1>
                    
                    <!-- SKU / Code -->
                    <p class="text-sm text-gray-500 mb-6 font-mono">
                        Cod produs: {{ product.sku}}
                    </p>
                </div>

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
                            @click.prevent="toggleFavorite"
                        />
                    </div>
                    <div class="flex items-center">
                        <p class="text-sm text-gray-500 flex items-center gap-1">
                            <span>Sau comanda</span>
                            <a href="tel:+40751022882" class="font-bold underline cursor-pointer">telefonic</a>
                            <UIcon name="i-lucide-phone" class="w-4 h-4" />
                        </p>
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

    <div class="mt-12" v-if="product?.categoryId">
        <CategoryCarousel 
            title="Produse similare" 
            :categoryId="product?.categoryId"
        />
    </div>
  </UContainer>
</template>
