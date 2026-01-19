<script setup lang="ts">
const route = useRoute()

</script>

<template>
  <div>
    <UHeader toggle-side="right" mode="slideover">
    <template #title>
      <AppLogo class="h-6 w-auto" />
    </template>

    <UInput icon="i-lucide-search" size="xl" variant="outline" placeholder="Cauta produse..." />

    <template #right>
      <UTooltip text="Shopping Cart" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="/cart"
          icon="i-lucide-shopping-cart"
          aria-label="Shopping Cart"
        />
      </UTooltip>

      <Dropdown />
    </template>
    </UHeader>

    <div class="w-full py-2 bg-black">
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

