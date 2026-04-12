<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data: product } = await useFetch(`/api/products/${slug}`)

if (!product.value) {
  throw createError({ statusCode: 404, message: 'Product not found' })
}

// Simple SEO
useSeoMeta({
  title: product.value.name,
  description: product.value.description
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

const accordionItems = [
  {
    label: 'Livrare',
    icon: 'i-lucide-truck',
    content: 'Livrarea se face prin curier rapid in 24-48 de ore de la confirmarea comenzii. Costul transportului este de 19 Lei pentru comenzile sub 200 Lei, si gratuit pentru cele care depasesc aceasta suma. Toate coletele sunt asigurate pe durata transportului.'
  },
  {
    label: 'Retur',
    icon: 'i-lucide-rotate-ccw',
    content: 'Ai la dispozitie 14 zile calendaristice pentru a returna produsul, fara invocarea niciunui motiv. Produsul trebuie sa fie in aceeasi stare in care a fost livrat, in ambalajul original cu toate accesoriile.',
  }
]
</script>

<template>
  <UContainer class="py-6">
    <UBreadcrumb :items="breadcrumbs" class="mb-6 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_li]:shrink-0 [&_li:last-child]:shrink-1 [&_li:last-child]:min-w-0" />
    <div v-if="product" class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <div class="w-full md:col-span-7">
            <ProductCarousel :productImages="product.image ? [product.image, product.image, product.image] : []"/>
        </div>

        <div class="w-full md:col-span-5">
            <div class="flex flex-col h-full md:pb-[80px]">
                <!-- Brand container -->
                <div v-if="product.brand" class="mb-6 bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <img v-if="product.brand.image" :src="product.brand.image" :alt="product.brand.name" class="h-6 object-contain" />
                    <span v-else class="font-bold text-gray-900 border-gray-100 dark:text-white">{{ product.brand.name }}</span>
                    <NuxtLink :to="`/producatori/${product.brand.slug}`" class="text-xs text-gray-500 underline hover:text-primary transition-colors">Vezi toate produsele</NuxtLink>
                </div>

                <!-- Title -->
                <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight lowercase first-letter:uppercase">
                    {{ product.name }}
                </h1>
                
                <!-- SKU / Code -->
                <p class="text-sm text-gray-500 mb-6 font-mono">
                    Cod: {{ product.sku}}
                </p>

                <!-- Stock Status -->
                <div class="flex items-center gap-2 mb-2 font-medium" :class="stockColor">
                    <UBadge color="success" variant="soft" class="rounded-sm" leading-icon="i-lucide-check">In stoc</UBadge>
                </div>

                <!-- Price -->
                <div class="flex flex-col gap-0 mb-6">
                    <p class="text-3xl lg:text-3xl font-bold text-gray-900">{{ product.price }} RON</p>
                    <span class="text-xs text-gray-500">Pretul include TVA</span>
                </div>

                <!-- Actions -->
                <div class="flex flex-col items-start gap-3 mb-8 w-full max-w-md">
                    <div class="flex items-center gap-2">
                        <p>Cantitate:</p>
                        <UInputNumber
                            v-model="quantity" 
                            :min="1" 
                            class="w-24"
                            size="xs"
                        />
                    </div>
                    <div class="flex gap-2">
                        <UButton 
                            block  
                            class="flex-1"
                            color="primary" 
                            variant="subtle"
                            icon="i-lucide-shopping-cart"
                            @click="addToCart(product, quantity)"
                        >
                            Adauga in cos
                        </UButton>
                        <UButton 
                            size="xl" 
                            color="primary" 
                            variant="subtle"
                            icon="i-lucide-heart"
                        />
                    </div>
                </div>
                
                <!-- Additional Info -->
                <div class="mt-auto w-full dark:border-gray-800 pt-6">
                    <UAccordion :items="accordionItems" color="primary" variant="soft" size="md" default-value="0" />
                </div>
            </div>
        </div>
    </div>

    <!-- Description Container -->
    <div v-if="product && product.description" class="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
        <h2 class="text-2xl font-semibold mb-4">Descriere produs</h2>
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
