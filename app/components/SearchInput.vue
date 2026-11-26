<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { InternalApi } from 'nitropack/types'

// A product in the preview, as GET /api/products sends it.
type PreviewProduct = InternalApi['/api/products']['get']['products'][number]

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'search'])

const localQuery = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isOpen = ref(false)
const isLoading = ref(false)
const products = ref<PreviewProduct[]>([])
const containerRef = ref<HTMLElement | null>(null)

// Cache: simple LRU map limit to 50
const searchCache = new Map<string, PreviewProduct[]>()
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
      query: { q: query, limit: 5, facets: 0 },
      signal: abortController.signal
    })

    products.value = res.products || []
    searchCache.set(query, products.value)

    // Enforce max cache size
    if (searchCache.size > 50) {
      const firstKey = searchCache.keys().next().value
      if (firstKey !== undefined) {
        searchCache.delete(firstKey)
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
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

const onPointerDown = (e: PointerEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') isOpen.value = false
}

const router = useRouter()
const stopAfterEach = router.afterEach(() => {
  isOpen.value = false
})

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortController) abortController.abort()
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeyDown)
  stopAfterEach()
})

const performSearch = () => {
  isOpen.value = false
  emit('search')
}
</script>

<template>
  <ClientOnly>
    <Teleport to="#search-backdrop">
      <Transition
        enter-active-class="transition-opacity duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen && localQuery.trim().length >= 3"
          class="fixed inset-0 z-40 bg-black/20"
          aria-hidden="true"
        />
      </Transition>
    </Teleport>
  </ClientOnly>

  <div ref="containerRef" class="relative z-[60] w-full">
    <!-- Typing opens the preview too, not just focusing the box: after Escape
         or a search the box keeps its focus, so no new focus event comes. -->
    <UInput
      v-model="localQuery"
      size="md"
      variant="outline"
      placeholder="Cauta produse..."
      class="w-full"
      color="primary"
      :ui="{ base: 'text-sm' }"
      @update:model-value="isOpen = true"
      @keyup.enter="performSearch"
      @focus="isOpen = true"
    >
      <template #trailing>
        <UButton
          color="neutral"
          variant="link"
          icon="i-lucide-search"
          size="md"
          class="p-0"
          aria-label="Cauta"
          @click="performSearch"
        />
      </template>
    </UInput>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && localQuery.trim().length >= 3"
        class="absolute top-full right-0 left-0 mt-3 flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-md rounded-t-none border border-gray-200 bg-white shadow-sm sm:mt-4 dark:border-gray-800 dark:bg-gray-900"
      >
        <div v-if="isLoading" class="flex items-center justify-center p-8">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-primary" />
        </div>

        <div v-else-if="products.length > 0" class="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <NuxtLink
            v-for="product in products"
            :key="product.id"
            :to="`/c/${product.category?.slug || 'toate'}/${product.slug}`"
            class="flex items-center gap-3 border-b border-gray-100 p-3 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
          >
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800"
            >
              <NuxtImg
                v-if="product.images && product.images.length > 0"
                :src="product.images[0]"
                alt=""
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <UIcon v-else name="i-lucide-image" class="h-6 w-6 text-gray-400" />
            </div>

            <div class="min-w-0 flex-1">
              <p
                class="line-clamp-2 text-sm leading-tight font-medium break-words text-gray-900 dark:text-white"
              >
                {{ product.name }}
              </p>
              <p class="mt-1 text-xs font-semibold text-primary">
                {{ product.price.toFixed(2) }} RON
              </p>
            </div>
          </NuxtLink>
        </div>

        <div
          v-if="!isLoading && products.length > 0"
          class="shrink-0 border-t border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900/50"
        >
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

        <div
          v-else-if="!isLoading && products.length === 0"
          class="p-6 text-center text-sm text-gray-500"
        >
          Nu s-au gasit produse.
        </div>
      </div>
    </Transition>
  </div>
</template>
