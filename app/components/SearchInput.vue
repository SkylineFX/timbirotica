<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'search'])

const localQuery = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isFocused = ref(false)
const isLoading = ref(false)
const products = ref<any[]>([])

// Cache: simple LRU map limit to 50
const searchCache = new Map<string, any[]>()
let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const fetchPreview = async (query: string) => {
  if (query.length < 3) {
    products.value = []
    return
  }
  
  if (searchCache.has(query)) {
    products.value = searchCache.get(query)!
    return
  }

  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()
  isLoading.value = true

  try {
    const res = await $fetch('/api/products', {
      query: { q: query, limit: 5 },
      signal: abortController.signal
    }) as any
    
    products.value = res.products || []
    searchCache.set(query, products.value)
    
    // Enforce max cache size
    if (searchCache.size > 50) {
      const firstKey = searchCache.keys().next().value
      if (firstKey !== undefined) {
        searchCache.delete(firstKey)
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Ignored
    } else {
      console.error('Search preview error:', error)
    }
  } finally {
    isLoading.value = false
  }
}

watch(localQuery, (newQuery) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  
  const trimmed = newQuery.trim()
  if (trimmed.length < 3) {
    products.value = []
    return
  }
  
  debounceTimer = setTimeout(() => {
    fetchPreview(trimmed)
  }, 300)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortController) abortController.abort()
})

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
  }, 200)
}

const performSearch = () => {
  isFocused.value = false
  emit('search')
}
</script>

<template>
  <div class="relative w-full z-[60]">
    <UInput
      v-model="localQuery"
      @keyup.enter="performSearch"
      @focus="isFocused = true"
      @blur="handleBlur"
      trailing-icon="i-lucide-search"
      size="md"
      variant="outline"
      placeholder="Cauta produse..."
      class="w-full"
      color="primary"
      :ui="{base: 'text-sm'}"
    />

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isFocused && localQuery.trim().length >= 3" 
        class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden flex flex-col"
      >
        <div v-if="isLoading" class="p-8 flex justify-center items-center">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-primary w-6 h-6" />
        </div>
        
        <div v-else-if="products.length > 0" class="flex flex-col max-h-96 overflow-y-auto">
          <NuxtLink 
            v-for="product in products" 
            :key="product.id" 
            :to="`/c/${product.category?.slug || 'toate'}/${product.slug}`" 
            class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
          >
            <div class="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden flex items-center justify-center">
              <NuxtImg v-if="product.images && product.images.length > 0" :src="product.images[0]" class="w-full h-full object-cover" />
              <UIcon v-else name="i-lucide-image" class="text-gray-400 w-6 h-6" />
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 break-words leading-tight">{{ product.name }}</p>
              <p class="text-xs font-semibold text-primary mt-1">{{ product.price }} RON</p>
            </div>
          </NuxtLink>
        </div>
        
        <div v-if="!isLoading && products.length > 0" class="border-t border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-900/50 mt-auto">
          <UButton 
            variant="ghost" 
            color="primary" 
            block 
            class="rounded-sm" 
            trailing-icon="i-lucide-arrow-right"
            @click="performSearch"
          >
            Vezi toate rezultatele
          </UButton>
        </div>
        
        <div v-else-if="!isLoading && products.length === 0" class="p-6 text-center text-sm text-gray-500">
          Nu s-au gasit produse.
        </div>
      </div>
    </Transition>
  </div>
</template>
