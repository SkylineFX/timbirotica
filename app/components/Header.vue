<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const { loggedIn, clear, user } = useUserSession()

const loggedInItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Salut ' + (user.value?.name || 'Client'),
      disabled: true,
      class: 'font-bold text-gray-900 dark:text-white'
    }
  ],
  [
    {
      label: 'Detalii cont',
      icon: 'i-lucide-user'
    },
    {
      label: 'Comenzile mele',
      icon: 'i-lucide-receipt-text'
    },
  ],
  [
    {
      label: 'Deconectare',
      color: 'error',
      icon: 'i-lucide-log-out',
      onSelect: clear
    }
  ]
]

const loggedOutItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Autentificare',
      color: 'success',
      icon: 'i-lucide-log-in',
      to: '/login'
    },
    {
      label: 'Inregistrare',
      icon: 'i-lucide-lock',
      to: '/register'
    },
  ],
]


const items = computed(() => {
  if (loggedIn.value) {
    return loggedInItems
  }
  return loggedOutItems;
})

const navigation = ref([
  {
    label: 'Toate Produsele',
    to: '#',
    children: [
      {
        label: 'Introduction',
        to: '#introduction',
      },
      {
        label: 'Installation',
        to: '#installation'
      }
    ]
  },
  {
    label: 'Producatori',
    to: '#',
    children: [
      {
        label: 'defineShortcuts',
        to: '#defineshortcuts'
      },
      {
        label: 'useModal',
        to: '#usemodal'
      }
    ]
  },
  {
    label: "Contactati-ne",
    to: "#"
  }
])
</script>

<template>
  <div>
    <UHeader toggle-side="right" mode="slideover">
      <template #title>
        <AppLogo class="h-6 w-auto" />
      </template>

      <UInput
        icon="i-lucide-search"
        size="xl"
        variant="outline"
        placeholder="Cauta produse..."
      />

      <template #right>
        <UTooltip text="Cosul meu">
          <UButton
            color="neutral"
            variant="ghost"
            to="/cart"
            icon="i-lucide-shopping-cart"
            aria-label="Cosul meu"
          />
        </UTooltip>

        <UDropdownMenu :items="items" :ui="{ content: 'w-48' }">
          <UButton 
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            aria-label="Contul meu"
          >
            <span class="hidden md:inline">Contul meu</span>
          </UButton>
        </UDropdownMenu>
      </template>

      <template #body>
        <UInput
          class="w-full mb-2"
          size="md"
          variant="subtle"
          placeholder="Cauta produse..."
        />

        <USeparator />

        <UNavigationMenu :items="navigation" orientation="vertical" />
      </template>
    </UHeader>

    <!-- Desktop menu -->
    <div class="w-full py-2 bg-black hidden lg:block">
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
    </div>

  </div>
</template>

