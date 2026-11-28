<script setup lang="ts">
const { data: categories } = await useCategoryTree()
</script>

<template>
  <UContainer class="py-8 lg:py-12">
    <h1 class="mb-4 text-2xl font-bold md:mb-6 lg:text-3xl">Toate Categoriile</h1>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="category in categories"
        :key="category.id"
        class="flex h-full flex-col overflow-hidden rounded-sm"
        :ui="{ body: 'flex-1 flex flex-col !p-0' }"
      >
        <div class="flex min-h-[9rem] flex-1 sm:min-h-[10rem]">
          <!-- Left: Image -->
          <NuxtLink
            :to="category.to"
            class="flex w-2/5 items-center justify-center border-r border-gray-200 transition-opacity hover:opacity-90"
          >
            <div class="flex h-full w-full items-center justify-center bg-gray-50/0">
              <NuxtImg
                v-if="category.image"
                :src="category.image"
                :alt="category.label"
                loading="lazy"
                class="h-full w-full object-contain p-4"
              />
              <UIcon v-else name="i-lucide-image" class="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            </div>
          </NuxtLink>

          <!-- Right: Content -->
          <div class="flex w-3/5 flex-col p-4">
            <NuxtLink :to="category.to" class="group">
              <h2
                class="mb-2 line-clamp-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-primary sm:text-lg"
              >
                {{ category.label }}
              </h2>
            </NuxtLink>

            <!-- Subcategories (up to 3) -->
            <ul v-if="category.children && category.children.length > 0" class="space-y-1">
              <li v-for="sub in category.children.slice(0, 3)" :key="sub.id">
                <NuxtLink
                  :to="sub.to"
                  class="block truncate text-sm text-gray-500 hover:text-primary"
                >
                  {{ sub.label }}
                </NuxtLink>
              </li>
              <li v-if="category.children.length > 3" class="mt-1 text-xs">
                <NuxtLink
                  :to="category.to"
                  class="text-gray-400 transition-colors hover:text-primary"
                >
                  + {{ category.children.length - 3 }} subcategorii
                </NuxtLink>
              </li>
            </ul>
            <div v-else class="mt-auto">
              <NuxtLink
                :to="category.to"
                class="text-sm font-medium text-primary hover:text-primary"
              >
                Vezi produse &rarr;
              </NuxtLink>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
