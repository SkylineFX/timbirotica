<script setup lang="ts">
const { user, clear } = useUserSession()
const router = useRouter()
const { count: pendingCount, refresh: refreshPendingCount } = usePendingOrders()

const navItems = computed(() => [
  { to: '/admin/orders', label: 'Comenzi', icon: 'i-lucide-package', badge: pendingCount.value },
  { to: '/admin/products', label: 'Produse', icon: 'i-lucide-shopping-bag', badge: 0 },
])

onMounted(() => { refreshPendingCount() })

async function logout() {
  await clear()
  await router.push('/')
}
</script>

<template>
  <div class="h-screen flex bg-stone-100 overflow-hidden">
    <aside class="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div class="px-5 py-6 border-b border-gray-200">
        <NuxtLink to="/admin/orders" class="font-inter text-lg font-semibold tracking-tight flex flex-col items-end">
          <img src="/logo.svg" alt="Eurotimalex" class="w-full" />
          <p class="font-bold text-gray-900 text-xl">Administrator</p>
        </NuxtLink>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-stone-100 transition-colors"
          active-class="bg-primary-50 text-primary font-medium"
        >
          <UIcon :name="item.icon" class="size-4" />
          <span class="flex-1">{{ item.label }}</span>
          <UBadge v-if="item.badge > 0" color="warning" variant="solid" size="xs">{{ item.badge }}</UBadge>
        </NuxtLink>
      </nav>

      <div class="border-t border-gray-200 p-4 space-y-2">
        <p class="text-xs text-gray-500">Conectat ca</p>
        <p class="text-sm font-medium text-gray-900 truncate">{{ user?.firstName }} {{ user?.lastName }}</p>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
          to="/"
          class="w-full justify-start"
        >Inapoi la magazin</UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-log-out"
          class="w-full justify-start"
          @click="logout"
        >Deconectare</UButton>
      </div>
    </aside>

    <main class="flex-1 overflow-hidden flex flex-col">
      <div class="flex-1 overflow-hidden p-6 lg:p-8 flex flex-col min-h-0">
        <slot />
      </div>
    </main>
  </div>
</template>
