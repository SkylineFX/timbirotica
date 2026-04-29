<script setup>
useHead({
  bodyAttrs: {
    class: 'bg-stone-100 min-h-screen'
  }
})

const { loggedIn } = useUserSession()
const { syncCart, clearCart } = useCart()

// Sync any guest-cart items that accumulated before this page loaded.
// This covers OAuth flows (e.g. Google) where the server sets the session and
// redirects directly — there is no client-side login handler to call syncCart().
// For email/password login, syncCart() is already called in the form submit
// handler and app.vue is never remounted during that client-side navigation.
onMounted(async () => {
  if (loggedIn.value && localStorage.getItem('guest-cart')) {
    await syncCart()
  }
})

// When the user logs out, clear the in-memory cart immediately.
// Without this, cartItems still holds the DB items after logout. If the user
// then adds a new item as a guest, the watcher would persist the entire
// cartItems array (DB items + new item) to localStorage, causing those DB
// items to be re-synced (and their quantities doubled) on the next login.
watch(loggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    clearCart()
  }
})
</script>

<template>
  <UApp>
    <Header />


    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <Footer />
  </UApp>
</template> 