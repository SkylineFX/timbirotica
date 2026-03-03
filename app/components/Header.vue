<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'


const { loggedIn, clear, user } = useUserSession()
const { cartItems, removeFromCart, updateQuantity, total, fetchCart, isCartOpen, isLoading } = useCart()

const { isFavoritesOpen, favorites } = useFavorites()
const isNavOpen = ref(false)

// Initialize cart
onMounted(() => {
    fetchCart()
})

const route = useRoute()

watch(() => route.path, () => {
    isNavOpen.value = false
    isCartOpen.value = false
    isFavoritesOpen.value = false
})

async function logout () {
  await clear()
  await navigateTo('/user/login')
}

const loggedOutItems: DropdownMenuItem[][] = [
  [{
    label: 'Autentificare',
    color: 'success',
    icon: 'i-lucide-log-in',
    to: '/user/login'
  }, {
    label: 'Inregistrare',
    icon: 'i-lucide-lock',
    to: '/user/register'
  }]
]

const loggedInItems = computed(() => [
  [{
    label: 'Salut ' + (user.value?.name || 'Client'),
    disabled: true,
    class: 'font-bold text-gray-900 dark:text-white'
  }],
  [{
    label: 'Detalii cont',
    icon: 'i-lucide-user'
  }, {
    label: 'Comenzile mele',
    icon: 'i-lucide-receipt-text'
  }],
  [{
    label: 'Deconectare',
    color: 'error',
    icon: 'i-lucide-log-out',
    onSelect: logout
  }]
])

const dropdownItems = computed(() => loggedIn.value ? loggedInItems.value : loggedOutItems)

const { data: categoryTree } = useFetch('/api/categories/tree')
const { data: brands } = useFetch('/api/brands')

const navigation = computed(() => [
  {
    label: 'Toate Produsele',
    to: '/categorii',
    children: categoryTree.value || [],
    open: true,
    disabled: true
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  },
  {
    label: "Contact",
    to: '/contact'
  }
])
</script>

<template>
  <div class="sticky top-0 z-50 bg-white backdrop-blur-none border-b border-gray-200 dark:border-gray-800">
    <UContainer class="h-16 flex items-center justify-between gap-4 max-w-7xl">
      <!-- Left: Navigation Toggle & Logo -->
      <div class="flex items-center gap-4">
        <UButton 
          icon="i-lucide-menu" 
          color="neutral" 
          variant="ghost" 
          @click="isNavOpen = true"
          aria-label="Menu"
        />
        <NuxtLink to="/" class="flex-shrink-0">
          <NuxtImg src="/logo.svg" alt="Logo" class="h-6 lg:h-8 w-auto" />
        </NuxtLink>
      </div>

      <!-- Center: Search (Desktop) -->
      <div class="hidden sm:flex flex-1 max-w-lg mx-4">
        <UInput
          trailing-icon="i-lucide-search"
          size="md"
          variant="outline"
          placeholder="Cauta produse..."
          class="w-full"
          color="primary"
        />
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2">
        <UDropdownMenu :items="dropdownItems" :ui="{ content: 'w-48' }">
          <UButton 
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            aria-label="Contul meu"
          >
            <span class="hidden md:inline">Contul meu</span>
          </UButton>
        </UDropdownMenu>

        <!-- show only if user is logged in -->
        <div v-if="user">
          <UButton 
            color="neutral" 
            variant="ghost" 
            icon="i-lucide-heart" 
            aria-label="Favorite"
            @click="isFavoritesOpen = true"
            class="relative"
          >
              <UBadge 
              v-if="favorites.length > 0" 
              color="primary" 
              :label="favorites.length" 
              class="absolute -top-0.5 -right-0.5 rounded-full text-[10px] w-4 h-4 flex items-center justify-center p-0 ring-2 ring-white dark:ring-gray-900" 
            />
          </UButton>
        </div>

        <UButton 
          color="neutral" 
          variant="ghost" 
          icon="i-lucide-shopping-cart" 
          aria-label="Cosul meu"
          @click="isCartOpen = true"
          class="relative"
          :loading="isLoading"
        >
          <UBadge 
            v-if="cartItems.length > 0" 
            color="primary" 
            :label="cartItems.length" 
            class="absolute -top-0.5 -right-0.5 rounded-full text-[10px] w-4 h-4 flex items-center justify-center p-0 ring-2 ring-white dark:ring-gray-900" 
          />
        </UButton>
      </div>
    </UContainer>

    <!-- Navigation Slideover (Left) -->
    <USlideover v-model:open="isNavOpen" side="left" title="Meniu">
      <template #body>
        <!-- Search on Mobile -->
        <div class="mb-4 sm:hidden">
            <UInput
            class="w-full"
            size="md"
            variant="subtle"
            placeholder="Cauta produse..."
            />
        </div>

        <UNavigationMenu :items="navigation" orientation="vertical" type="single" />
      </template>
    </USlideover>

    <!-- Cart Slideover (Right) -->
    <USlideover v-model:open="isCartOpen" side="right" title="Cosul meu" :ui="{ body: 'py-0 sm:py-0' }">
      <template #body>
          <div v-if="cartItems.length === 0" class="p-8 text-center text-gray-500">
            Cosul tau este gol.
          </div>
          <UList v-else>
            <UListItem v-for="item in cartItems" :key="item.id || item.productId" class="flex gap-4 py-8 border-b border-gray-200 dark:border-gray-800">
              <NuxtImg :src="item.product?.image || ''" class="w-16 h-16 object-contain bg-white rounded-md" />
              <div class="flex-1 flex flex-col justify-between">
                <div>
                    <p class="font-medium text-sm line-clamp-2">{{ item.product?.name }}</p>
                </div>
                <div class="flex justify-between items-center mt-2">
                       <div class="flex items-center gap-1">
                           <UButton size="xs" color="error" variant="soft" icon="i-lucide-trash-2" @click="removeFromCart(item.id)" />
                           <UInputNumber size="xs" class="w-24" :model-value="item.quantity" :min="0" :step="1" @update:model-value="(val) => updateQuantity(item.id, Number(val))" />
                       </div>
                       <div class="flex flex-col items-end">
                           <span class="font-bold text-sm">{{ (item.product?.price * item.quantity).toFixed(2) }} RON</span>
                       </div>
                </div>
              </div>
            </UListItem>
          </UList>
      </template>

      <template #footer>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full flex justify-between items-center">
            <span class="font-semibold text-lg">Subtotal:</span>
            <span class="font-semibold text-lg">{{ total.toFixed(2) }} RON</span>
          </div>
          <div class="w-full flex justify-end">
            <p class="text-xs text-gray-500">Preturile includ TVA</p>
          </div>
          <UButton 
            color="primary" 
            variant="subtle" 
            to="/checkout" 
            @click="isCartOpen = false"
            trailing-icon="i-lucide-arrow-right"
            block
            class="rounded-sm p-3 justify-between"
            :disabled="cartItems.length === 0"
          >
            Continua spre livrare
          </UButton>
        </div>
      </template>
    </USlideover>


    <FavoritesSlideover />
  </div>
</template>

