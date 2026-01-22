<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const { loggedIn, clear, user } = useUserSession()
const isCartOpen = ref(false)

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
    children: categoryTree.value || []
  },
  {
    label: 'Producatori',
    to: '/producatori',
    children: brands.value || []
  },
  {
    label: "Contactati-ne",
    to: '/contact'
  }
])
</script>

<template>
  <div>
    <UHeader toggle-side="left">
      <template #title>
        <NuxtImg src="/logo.svg" alt="Logo" class="h-6 lg:h-8 w-auto" />
      </template>

      <UInput
        trailing-icon="i-lucide-search"
        size="xl"
        variant="outline"
        placeholder="Cauta produse..."
        class="hidden sm:inline-flex w-96 ml-4"
        color="primary"
      />

      <template #right>
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

        <USlideover v-model:open="isCartOpen" side="right" title="Cosul meu">
          <UButton 
            color="neutral" 
            variant="ghost" 
            icon="i-lucide-shopping-cart" 
            aria-label="Cosul meu"
            @click="isCartOpen = true"
          />

          <template #body>
            <UCard>
              <UList>
                <UListItem>
                  <UListItemTitle>Item 1</UListItemTitle>
                </UListItem>
              </UList>
            </UCard>
          </template>

          <template #footer>
            <div class="w-full flex flex-col gap-2">
              <div class="w-full flex justify-between items-center">
                <span class="font-semibold text-lg">Subtotal:</span>
                <span class="font-semibold text-lg">0.00 RON</span>
              </div>
              <div class="w-full flex justify-end">
                <p class="text-xs text-gray-500">Preturile includ TVA</p>
              </div>
              <UButton 
                color="primary" 
                variant="solid" 
                to="/checkout" 
                @click="isCartOpen = false"
                class="rounded-sm"
              >
                Continua spre livrare
              </UButton>
            </div>
          </template>
        </USlideover>

      </template>

      <template #body>
        <UInput
          class="w-full mb-2"
          size="md"
          variant="subtle"
          placeholder="Cauta produse..."
        />

        <USeparator />

        <UNavigationMenu :items="navigation" orientation="vertical" type="single" />
      </template>
    </UHeader>

    <!-- Desktop menu -->
    <!-- <div class="w-full py-2 bg-black hidden sm:block">
      <UContainer class="flex gap-2">
        <div>
          <USlideover side="left" title="Toate produsele">
            <UButton label="Toate produsele" color="primary" variant="solid" />

            <template #body>
              <Placeholder />
            </template>
          </USlideover>
        </div>

        <div>
          <USlideover side="left" inset title="Slideover with inset">
            <UButton label="Categorii" color="primary" variant="solid" />

            <template #body>
              <UCard>
                <UList>
                  <UListItem>
                    <UListItemTitle>Item 1</UListItemTitle>
                  </UListItem>
                </UList>
              </UCard>
            </template>
          </USlideover>
        </div>
      </UContainer>
    </div> -->

  </div>
</template>

