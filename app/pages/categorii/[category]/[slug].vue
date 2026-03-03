<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const categorySlug = route.params.category as string

const { data: product } = await useFetch(`/api/products/${slug}`)

if (!product.value) {
  throw createError({ statusCode: 404, message: 'Product not found' })
}

// Simple SEO
useSeoMeta({
  title: product.value.name,
  description: product.value.description
})

const quantity = ref(1)

const stockColor = computed(() => {
    const status = product.value?.description?.toLowerCase() || ''
    if (status.includes('limitat')) return 'text-orange-600 dark:text-orange-500'
    if (status.includes('epuizat') || status.includes('indisponibil')) return 'text-red-600 dark:text-red-500'
    return 'text-green-600 dark:text-green-500'
})

const { addToCart } = useCart()
</script>

<template>
  <UContainer class="py-6">
    <div v-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div class="flex items-center justify-center">
            <ProductCarousel :productImages="product.image ? [product.image] : []"/>
        </div>

        <div class="flex flex-col">
            <div v-if="product.brand" class="mb-4">
                <UBadge color="neutral" variant="soft" size="md">
                    {{ product.brand.name }}
                </UBadge>
            </div>

            <!-- Title -->
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                {{ product.name }}
            </h1>
            
            <!-- SKU / Code -->
            <p class="text-sm text-gray-500 mb-6 font-mono">
                Cod: {{ product.sku}}
            </p>

            <!-- Price -->
            <div class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {{ product.price }} Lei
            </div>

            <!-- Stock Status -->
            <div class="flex items-center gap-2 mb-8 font-medium" :class="stockColor">
                <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                <span>{{ 'Stoc disponibil' }}</span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 mb-8 w-full max-w-md">
                <UInput 
                    type="number" 
                    v-model="quantity" 
                    :min="1" 
                    class="w-24"
                    size="xl"
                />
                <UButton 
                    size="xl" 
                    block  
                    class="flex-1"
                    color="primary" 
                    variant="subtle"
                    icon="i-lucide-shopping-cart"
                    @click="addToCart(product, quantity)"
                >
                    Adauga in cos
                </UButton>
            </div>
            
            <!-- Additional Info / Description Placeholders -->
             <div class="border-t border-gray-200 dark:border-gray-800 pt-6 mt-auto">
                <h3 class="text-lg font-semibold mb-2">Descriere produs</h3>
                <div class="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300">
                    <p>{{ product.description }}</p>
                </div>
            </div>
        </div>
    </div>

    <div class="mt-12">
        <h2 class="text-2xl font-bold mb-6">Produse similare</h2>
        <CategoryCarousel :url="`/api/products?category=${categorySlug}&limit=6`"/>
    </div>
  </UContainer>
</template>
