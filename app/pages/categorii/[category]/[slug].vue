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
</script>

<template>
  <UContainer class="py-12">
    <div v-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Image Section -->
        <div class="bg-white rounded-lg p-8 flex items-center justify-center border border-gray-200 dark:border-gray-800">
            <NuxtImg 
                :src="product.image || ''" 
                :alt="product.name"
                class="max-w-full max-h-[500px] object-contain"
            />
        </div>

        <!-- Details Section -->
        <div class="flex flex-col gap-6">
            <div>
                <UBadge v-if="product.brand" color="neutral" variant="soft" class="mb-2">
                    {{ product.brand.name }}
                </UBadge>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ product.name }}</h1>
                <p class="text-sm text-gray-500 mt-1">Cod: {{ product.slug }}</p>
            </div>

            <div class="text-2xl font-bold text-primary">
                {{ product.price }} RON
            </div>

            <div class="prose dark:prose-invert">
                <p v-if="product.description">{{ product.description }}</p>
            </div>

            <div class="mt-auto">
                 <UButton 
                    size="xl" 
                    block 
                    color="primary" 
                    icon="i-lucide-shopping-cart"
                >
                    Adauga in cos
                </UButton>
            </div>
        </div>
    </div>
  </UContainer>
</template>
