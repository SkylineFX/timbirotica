<script setup lang="ts">
const { user, clear } = useUserSession()
const router = useRouter()
const { count: pendingCount, refresh: refreshPendingCount } = usePendingOrders()

const navItems = computed(() => [
  { to: '/admin/orders', label: 'Comenzi', icon: 'i-lucide-package', badge: pendingCount.value },
  { to: '/admin/products', label: 'Produse', icon: 'i-lucide-shopping-bag', badge: 0 }
])

onMounted(() => {
  refreshPendingCount()
})

async function logout() {
  // Save cart quantity changes still waiting while the session is valid.
  await flushCartQuantityUpdates()
  await clear()
  await router.push('/')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-stone-100">
    <aside class="flex w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      <div class="border-b border-gray-200 px-5 py-6">
        <NuxtLink
          to="/admin/orders"
          class="font-inter flex flex-col items-end text-lg font-semibold tracking-tight"
        >
          <img src="/logo.svg" alt="Timbirotica" class="w-full" />
          <p class="text-xl font-bold text-gray-900">Administrator</p>
        </NuxtLink>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-stone-100"
          active-class="bg-primary-50 text-primary font-medium"
        >
          <UIcon :name="item.icon" class="size-4" />
          <span class="flex-1">{{ item.label }}</span>
          <UBadge v-if="item.badge > 0" color="warning" variant="solid" size="xs">{{
            item.badge
          }}</UBadge>
        </NuxtLink>
      </nav>

      <div class="space-y-2 border-t border-gray-200 p-4">
        <p class="text-xs text-gray-500">Conectat ca</p>
        <p class="truncate text-sm font-medium text-gray-900">
          {{ user?.firstName }} {{ user?.lastName }}
        </p>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
          to="/"
          class="w-full justify-start"
          >Inapoi la magazin</UButton
        >
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-log-out"
          class="w-full justify-start"
          @click="logout"
          >Deconectare</UButton
        >
      </div>
    </aside>

    <main class="flex flex-1 flex-col overflow-hidden">
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
