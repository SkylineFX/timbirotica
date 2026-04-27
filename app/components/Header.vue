<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'


const { loggedIn, clear, user } = useUserSession()
const { cartItems, removeFromCart, updateQuantity, total, fetchCart, isCartOpen, isLoading } = useCart()

const { isFavoritesOpen, favorites } = useFavorites()
const isNavOpen = ref(false)
const activeMenus = ref<any[]>([])
const searchQuery = ref('')

function closeAll() {
  isNavOpen.value = false
  activeMenus.value = []
}

// Initialize cart
onMounted(() => {
    fetchCart()
})

const route = useRoute()

const performSearch = async () => {
    if (!searchQuery.value.trim()) return
    closeAll() // close mobile menu if opened
    await navigateTo({
        path: '/cautare',
        query: { q: searchQuery.value.trim() }
    })
}

watch(() => route.path, (newPath) => {
    closeAll()
    isCartOpen.value = false
    isFavoritesOpen.value = false
    if (newPath !== '/cautare') {
        searchQuery.value = ''
    }
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
    label: 'Salut ' + (user.value?.firstName || 'Client'),
    disabled: true,
    class: 'font-bold text-gray-900 dark:text-white'
  }],
  [{
    label: 'Detalii cont',
    icon: 'i-lucide-user',
    to: '/user',
  }, {
    label: 'Comenzile mele',
    icon: 'i-lucide-package',
    to: '/orders',
  }],
  [{
    label: 'Deconectare',
    color: 'error',
    icon: 'i-lucide-log-out',
    onSelect: logout
  }]
])

const dropdownItems = computed<any[][]>(() => loggedIn.value ? loggedInItems.value : loggedOutItems)

const { data: categoryTree } = useFetch('/api/categories/tree')
const { data: brands } = useFetch('/api/brands')

const navigation = computed(() => [
  {
    label: 'Categorii produse',
    to: '/c',
    children: categoryTree.value || [],
    open: true,
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  },
  {
    label: 'Produse recomandate',
    to: '/produse-recomandate'
  }
])
</script>

<template>
  <div class="sticky top-0 z-50 bg-white backdrop-blur-none border-b border-gray-200 dark:border-gray-800">
    <UContainer class="py-3 flex flex-col gap-3 sm:flex-row sm:h-16 sm:py-0 sm:items-center sm:justify-between max-w-7xl">
      <!-- Top Row (Mobile) / Left+Right (Desktop) -->
      <div class="flex items-center justify-between w-full sm:w-auto sm:flex-1">
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

        <!-- Center: Search (Desktop only) -->
        <div class="hidden sm:flex flex-1 max-w-lg mx-4">
          <SearchInput v-model="searchQuery" @search="performSearch" />
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <UDropdownMenu :items="dropdownItems" :ui="{ content: 'w-48' }">
            <UButton 
              color="neutral"
              variant="ghost"
              icon="i-lucide-user"
              aria-label="Contul meu"
              class=""
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
      </div>

      <!-- Bottom Row: Search (Mobile only) -->
      <div class="flex sm:hidden w-full">
        <SearchInput v-model="searchQuery" @search="performSearch" />
      </div>
    </UContainer>

    <!-- Navigation Slideover (Left) -->
    <USlideover v-model:open="isNavOpen" side="left" title="Meniu" @update:open="(val) => { if (!val) activeMenus = [] }">
      <template #body>
        <div class="flex flex-col gap-1">
          <template v-for="item in navigation" :key="item.label">
            <UButton
              v-if="item.children && item.children.length > 0"
              color="neutral"
              variant="ghost"
              class="justify-between w-full"
              trailing-icon="i-lucide-chevron-right"
              @click="activeMenus.push(item)"
            >
              <span class="truncate">{{ item.label }}</span>
            </UButton>
            <UButton
              v-else
              color="neutral"
              variant="ghost"
              :to="item.to"
              class="w-full"
              @click="closeAll"
            >
              <span class="truncate">{{ item.label }}</span>
            </UButton>
          </template>
        </div>
      </template>
      <template #footer>
        <div class="flex flex-col gap-1 w-full">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-phone"
            to="tel:+40751022882"
            class="justify-start w-full"
          >
            0751 022 882
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-mail"
            to="/contact"
            @click="closeAll"
            class="justify-start w-full"
          >
            Contact
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-user"
            :to="user ? '/user' : '/user/login'"
            @click="closeAll"
            class="justify-start w-full"
          >
            Contul meu
          </UButton>
        </div>
      </template>
    </USlideover>

    <!-- Nested Navigation Slideovers -->
    <USlideover 
      v-for="(menu, index) in activeMenus" 
      :key="index"
      :open="true"
      @update:open="(val) => { if(!val) closeAll() }"
      side="left"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <UButton 
            color="neutral"
            variant="ghost" 
            icon="i-lucide-arrow-left" 
            class="text-base font-semibold px-2 -ml-2"
            @click="activeMenus.splice(index)"
          >
            {{ menu.label }}
          </UButton>
          
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            aria-label="Close"
            @click="closeAll"
          />
        </div>
      </template>
      <template #body>
        <div class="flex flex-col gap-1">
          <template v-for="child in menu.children" :key="child.label">
            <UButton
              v-if="child.children && child.children.length > 0"
              color="neutral"
              variant="ghost"
              class="justify-between w-full"
              trailing-icon="i-lucide-chevron-right"
              @click="activeMenus.push(child)"
            >
              <span class="truncate">{{ child.label }}</span>
            </UButton>
            <UButton
              v-else
              color="neutral"
              variant="ghost"
              :to="child.to"
              class="w-full"
              @click="closeAll"
            >
              <span class="truncate">{{ child.label }}</span>
            </UButton>
          </template>
        </div>
      </template>
      <template #footer v-if="menu.to">
        <div class="w-full flex flex-col gap-2">
          <UButton 
            :to="menu.to" 
            color="primary" 
            variant="subtle" 
            trailing-icon="i-lucide-arrow-right"
            block
            class="rounded-sm p-3 justify-between"
            @click="closeAll"
          >
            Vezi toate
          </UButton>
        </div>
      </template>
    </USlideover>

    <!-- Cart Slideover (Right) -->
    <USlideover v-model:open="isCartOpen" side="right" title="Cosul meu" :ui="{ body: 'py-0 sm:py-0' }">
      <template #body>
          <div v-if="cartItems.length === 0" class="p-8 text-center text-gray-500">
            Cosul tau este gol.
          </div>
          <div v-else class="w-full">
            <CartItem v-for="item in cartItems" :key="item.id || item.productId" :item="item" />
          </div>
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

