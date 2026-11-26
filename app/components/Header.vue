<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { isSearchLongEnough } from '~~/shared/utils/search'

const { loggedIn, clear, user } = useUserSession()
const { cartItems, total, fetchCart, isCartOpen, isLoading } = useCart()

const { isFavoritesOpen, favorites } = useFavorites()
const isNavOpen = ref(false)
// A menu the navigation slideover opens: the brand list or a category.
type NavMenu = { label: string; to?: string; children?: NavMenu[] }
const activeMenus = ref<NavMenu[]>([])
const searchQuery = ref('')

function closeAll() {
  isNavOpen.value = false
  activeMenus.value = []
}

// Initialize cart.
// Skip the fetch when app.vue is about to run syncCart() (OAuth login case —
// a guest-cart exists and the user is already logged in on this fresh page load).
// syncCart() calls fetchCart() itself after the sync completes, so fetching
// here first would race against it and briefly show an empty cart.
onMounted(() => {
  if (loggedIn.value && import.meta.client && localStorage.getItem('guest-cart')) return
  fetchCart()
})

const route = useRoute()

const performSearch = async () => {
  // Searches shorter than 2 characters are not run (shared/utils/search.ts).
  if (!isSearchLongEnough(searchQuery.value)) return
  closeAll() // close mobile menu if opened
  await navigateTo({
    path: '/cautare',
    query: { q: searchQuery.value.trim() }
  })
}

watch(
  () => route.path,
  (newPath) => {
    closeAll()
    isCartOpen.value = false
    isFavoritesOpen.value = false
    if (newPath !== '/cautare') {
      searchQuery.value = ''
    }
  }
)

async function logout() {
  // Save cart quantity changes still waiting while the session is valid.
  await flushCartQuantityUpdates()
  await clear()
  await navigateTo('/user/login')
}

const loggedOutItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Autentificare',
      color: 'success',
      icon: 'i-lucide-log-in',
      to: '/user/login'
    },
    {
      label: 'Inregistrare',
      icon: 'i-lucide-lock',
      to: '/user/register'
    }
  ]
]

const loggedInItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Salut ' + (user.value?.firstName || 'Client'),
      disabled: true,
      class: 'font-bold text-gray-900 dark:text-white'
    }
  ],
  [
    {
      label: 'Detalii cont',
      icon: 'i-lucide-user',
      to: '/user'
    },
    {
      label: 'Adrese',
      icon: 'i-lucide-map-pin',
      to: '/user/adrese'
    },
    {
      label: 'Companii',
      icon: 'i-lucide-building-2',
      to: '/user/companii'
    },
    {
      label: 'Comenzile mele',
      icon: 'i-lucide-package',
      to: '/user/comenzi'
    }
  ],
  [
    {
      label: 'Deconectare',
      color: 'error',
      icon: 'i-lucide-log-out',
      onSelect: logout
    }
  ]
])

const dropdownItems = computed<DropdownMenuItem[][]>(() =>
  loggedIn.value ? loggedInItems.value : loggedOutItems
)

const { data: categoryTree } = useCategoryTree()
const { data: brands } = useBrandList()

// Top-level menu entries shown above the inlined category list in the slideover.
const navigation = computed(() => [
  {
    label: 'Produse recomandate',
    to: '/produse-recomandate'
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  }
])
</script>

<template>
  <div
    class="sticky top-0 z-50 border-b border-gray-200 bg-white backdrop-blur-none dark:border-gray-800"
  >
    <UContainer
      class="flex max-w-7xl flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0"
    >
      <!-- Top Row (Mobile) / Left+Right (Desktop) -->
      <div class="flex w-full items-center justify-between sm:w-auto sm:flex-1">
        <!-- Left: Navigation Toggle & Logo -->
        <div class="flex items-center gap-4">
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            aria-label="Meniu"
            @click="
              () => {
                isNavOpen = true
              }
            "
          />
          <NuxtLink to="/" class="flex-shrink-0">
            <NuxtImg src="/logo.svg" alt="Timbirotica" class="h-6 w-auto lg:h-8" />
          </NuxtLink>
        </div>

        <!-- Center: Search (Desktop only) -->
        <div class="mx-4 hidden max-w-lg flex-1 sm:flex">
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
              class="relative"
              @click="
                () => {
                  isFavoritesOpen = true
                }
              "
            >
              <UBadge
                v-if="favorites.length > 0"
                color="primary"
                :label="favorites.length"
                class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px] ring-2 ring-white dark:ring-gray-900"
              />
            </UButton>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-shopping-cart"
            aria-label="Cosul meu"
            class="relative"
            :loading="isLoading"
            @click="
              () => {
                isCartOpen = true
              }
            "
          >
            <UBadge
              v-if="cartItems.length > 0"
              color="primary"
              :label="cartItems.length"
              class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px] ring-2 ring-white dark:ring-gray-900"
            />
          </UButton>
        </div>
      </div>

      <!-- Bottom Row: Search (Mobile only) -->
      <div class="flex w-full sm:hidden">
        <SearchInput v-model="searchQuery" @search="performSearch" />
      </div>
    </UContainer>

    <!-- Navigation Slideover (Left) -->
    <USlideover
      v-model:open="isNavOpen"
      side="left"
      title="Oferta produse"
      @update:open="
        (val) => {
          if (!val) activeMenus = []
        }
      "
    >
      <template #body>
        <div class="flex flex-col gap-1">
          <!-- Top-level: Producatori + Produse recomandate -->
          <template v-for="item in navigation" :key="item.label">
            <UButton
              v-if="item.children && item.children.length > 0"
              color="neutral"
              variant="ghost"
              class="w-full justify-between"
              trailing-icon="i-lucide-chevron-right"
              @click="
                () => {
                  activeMenus.push(item)
                }
              "
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

          <!-- Categories inlined (avoids the extra "Categorii produse" hop) -->
          <template v-if="categoryTree && categoryTree.length > 0">
            <div class="my-2 border-t border-gray-200" />
            <template v-for="cat in categoryTree" :key="cat.label">
              <UButton
                v-if="cat.children && cat.children.length > 0"
                color="neutral"
                variant="ghost"
                class="w-full justify-between"
                trailing-icon="i-lucide-chevron-right"
                @click="
                  () => {
                    activeMenus.push(cat)
                  }
                "
              >
                <span class="truncate">{{ cat.label }}</span>
              </UButton>
              <UButton
                v-else
                color="neutral"
                variant="ghost"
                :to="cat.to"
                class="w-full"
                @click="closeAll"
              >
                <span class="truncate">{{ cat.label }}</span>
              </UButton>
            </template>
            <UButton
              to="/c"
              color="primary"
              variant="subtle"
              trailing-icon="i-lucide-arrow-right"
              block
              class="mt-2 justify-between rounded-sm"
              @click="closeAll"
            >
              Vezi toate categoriile
            </UButton>
          </template>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full flex-col gap-1">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-phone"
            to="tel:+40751022882"
            class="w-full justify-start"
          >
            0751 022 882
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-mail"
            to="/contact"
            class="w-full justify-start"
            @click="closeAll"
          >
            Contact
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-user"
            :to="user ? '/user' : '/user/login'"
            class="w-full justify-start"
            @click="closeAll"
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
      side="left"
      @update:open="
        (val) => {
          if (!val) closeAll()
        }
      "
    >
      <template #header>
        <div class="flex w-full items-center justify-between">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            class="-ml-2 px-2 text-base font-semibold"
            @click="
              () => {
                activeMenus.splice(index)
              }
            "
          >
            {{ menu.label }}
          </UButton>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            aria-label="Inchide"
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
              class="w-full justify-between"
              trailing-icon="i-lucide-chevron-right"
              @click="
                () => {
                  activeMenus.push(child)
                }
              "
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
      <template v-if="menu.to" #footer>
        <div class="flex w-full flex-col gap-2">
          <UButton
            :to="menu.to"
            color="primary"
            variant="subtle"
            trailing-icon="i-lucide-arrow-right"
            block
            class="justify-between rounded-sm p-3"
            @click="closeAll"
          >
            Vezi toate
          </UButton>
        </div>
      </template>
    </USlideover>

    <!-- Cart Slideover (Right) -->
    <USlideover
      v-model:open="isCartOpen"
      side="right"
      title="Cosul meu"
      :ui="{ body: 'py-0 sm:py-0' }"
    >
      <template #body>
        <div v-if="cartItems.length === 0" class="p-8 text-center text-gray-500">
          Cosul este gol.
        </div>
        <div v-else class="w-full">
          <CartItem v-for="item in cartItems" :key="item.id || item.productId" :item="item" />
        </div>
      </template>

      <template #footer>
        <div class="flex w-full flex-col gap-2">
          <div class="flex w-full items-center justify-between">
            <span class="text-lg font-semibold">Subtotal:</span>
            <span class="text-lg font-semibold">{{ total.toFixed(2) }} RON</span>
          </div>
          <div class="flex w-full justify-end">
            <p class="text-xs text-gray-500">Preturile includ TVA</p>
          </div>
          <UButton
            color="primary"
            variant="subtle"
            to="/checkout"
            trailing-icon="i-lucide-arrow-right"
            block
            class="justify-between rounded-sm p-3"
            :disabled="cartItems.length === 0"
            @click="
              () => {
                isCartOpen = false
              }
            "
          >
            Continua spre livrare
          </UButton>
        </div>
      </template>
    </USlideover>

    <FavoritesSlideover />
  </div>
</template>
