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
</script>

<template>
  <UContainer class="py-6">
    <UBreadcrumb :items="breadcrumbs" class="mb-6" />
    <div v-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div class="w-full">
            <ProductCarousel :productImages="product.image ? [product.image, product.image, product.image] : []"/>
        </div>

        <div class="flex flex-col">
            <!-- Title -->
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                {{ product.name }}
            </h1>
            
            <!-- SKU / Code -->
            <p class="text-sm text-gray-500 mb-6 font-mono">
                Cod: {{ product.sku}}
            </p>

            <!-- Price -->
            <div class="flex flex-col gap-0 mb-6">
                <p class="text-3xl lg:text-3xl font-bold text-gray-900">{{ product.price }} Lei</p>
                <span class="text-xs text-gray-500">Pretul include TVA</span>
            </div>

            <!-- Stock Status -->
            <div class="flex items-center gap-2 mb-4 font-medium" :class="stockColor">
                <UBadge color="success" variant="soft" class="rounded-sm" leading-icon="i-lucide-check">In stoc</UBadge>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 mb-8 w-full max-w-md">
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
                <UInput 
                    type="number" 
                    v-model="quantity" 
                    :min="1" 
                    class="w-24"
                    size="xl"
                />
            </div>
            
            <!-- Additional Info / Description -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-1 gap-6 flex-col justify-between">
                <div>
                  <h3 class="text-lg font-semibold mb-2">Descriere produs</h3>
                  <div class="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300">
                      <p>{{ product.description }}</p>
                  </div>
                </div>

                <!-- Brand container -->
                <div v-if="product.brand" class="bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                    <img v-if="product.brand.image" :src="product.brand.image" :alt="product.brand.name" class="h-8 object-contain" />
                    <span v-else class="font-bold text-gray-900">{{ product.brand.name }}</span>
                    <NuxtLink :to="`/producatori/${product.brand.slug}`" class="text-xs text-gray-500 underline hover:text-primary transition-colors">Vezi toate produsele</NuxtLink>
                </div>
            </div>
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
