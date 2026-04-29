export const useCart = () => {
  const { loggedIn } = useUserSession()
  const cartItems = useState<any[]>('cart-items', () => [])
  const isLoading = useState<boolean>('cart-loading', () => false)
  const isCartOpen = useState<boolean>('cart-open', () => false)
  const toast = useToast()

  // Explicitly fetch cart using $fetch (no caching issues)
  const fetchCart = async () => {
    isLoading.value = true
    try {
      if (loggedIn.value) {
        // Use $fetch, not useFetch, to avoid stale cache in actions
        const data = await $fetch('/api/cart') as any
        if (data && data.items) {
          cartItems.value = data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            product: item.product
          }))
        } else {
          cartItems.value = []
        }
      } else {
        // Guest: Load from LocalStorage
        if (import.meta.client) {
          const saved = localStorage.getItem('guest-cart')
          if (saved) {
            try {
              cartItems.value = JSON.parse(saved)
            } catch (e) {
              console.error('Invalid cart data in localStorage', e)
              localStorage.removeItem('guest-cart')
              cartItems.value = []
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch cart', e)
      // On error, don't crash, just empty list or keep previous
    } finally {
      isLoading.value = false
    }
  }

  // Persist guest cart to localStorage automatically.
  // Remove the key when the cart is empty so no stale entry (e.g. "[]") is left
  // behind after logout — that would otherwise cause an unnecessary syncCart()
  // call on the next OAuth login.
  watch(cartItems, (newItems) => {
    if (!loggedIn.value && import.meta.client) {
      if (newItems.length > 0) {
        localStorage.setItem('guest-cart', JSON.stringify(newItems))
      } else {
        localStorage.removeItem('guest-cart')
      }
    }
  }, { deep: true })

  // Initialize: If client-side and empty, fetch
  if (import.meta.client) {
    const saved = localStorage.getItem('guest-cart')
    if (saved && !loggedIn.value && cartItems.value.length === 0) {
      try {
        cartItems.value = JSON.parse(saved)
      } catch { /* ignore */ }
    }
  }

  const addToCart = async (product: any, quantity = 1) => {
    isLoading.value = true
    try {
      if (loggedIn.value) {
        // Optimistic Update (Optional): We could push to cartItems here immediately
        // But for reliability, let's wait for server.
        await $fetch('/api/cart', {
          method: 'POST',
          body: { productId: product.id, quantity }
        })
        await fetchCart()
      } else {
        // Guest Logic
        const existing = cartItems.value.find(item => item.productId === product.id)
        if (existing) {
          existing.quantity += quantity
        } else {
          cartItems.value.push({
            id: Date.now(), // Temp ID
            productId: product.id,
            quantity,
            product: product
          })
        }
      }
      toast.add({ title: 'Produs adaugat in cos', color: 'success' })
    } catch (e) {
      console.error('Failed to add to cart', e)
      toast.add({ title: 'Eroare la adaugarea in cos', color: 'error' })
    } finally {
      isLoading.value = false
    }
  }

  const removeFromCart = async (itemId: number) => {
    if (!itemId) return

    // Optimistic Update
    const previousItems = [...cartItems.value]
    cartItems.value = cartItems.value.filter(item => item.id !== itemId)

    if (loggedIn.value) {
      try {
        await $fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
        // DELETE confirmed — server state matches the optimistic update, no re-fetch needed.
      } catch (e) {
        console.error('Failed to remove item', e)
        cartItems.value = previousItems
        toast.add({ title: 'Nu s-a putut sterge produsul', color: 'error' })
      }
    }
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!itemId) return

    if (quantity <= 0) {
      await removeFromCart(itemId)
      return
    }

    const item = cartItems.value.find(i => i.id === itemId)
    if (!item) return

    const previousQuantity = item.quantity
    item.quantity = quantity

    if (loggedIn.value) {
      try {
        await $fetch(`/api/cart/${itemId}`, {
          method: 'PATCH',
          body: { quantity }
        })
        // PATCH confirmed — server state matches the optimistic update, no re-fetch needed.
      } catch (e) {
        console.error('Failed to update quantity', e)
        item.quantity = previousQuantity
        const toast = useToast()
        toast.add({ title: 'Nu s-a putut actualiza cantitatea', color: 'error' })
      }
    }
  }

  const clearCart = () => {
    cartItems.value = []
    if (import.meta.client) {
      localStorage.removeItem('guest-cart')
    }
  }

  const syncCart = async () => {
    if (!loggedIn.value) return

    let itemsToSync = []
    if (import.meta.client) {
      const saved = localStorage.getItem('guest-cart')
      if (saved) {
        try {
          itemsToSync = JSON.parse(saved)
        } catch { }
      }
    }

    if (itemsToSync.length > 0) {
      try {
        await $fetch('/api/cart/sync', {
          method: 'POST',
          body: {
            items: itemsToSync.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity
            }))
          }
        })
        if (import.meta.client) localStorage.removeItem('guest-cart')
        // Only fetch from DB after a successful sync so a sync failure doesn't
        // overwrite the in-memory guest cart with an empty DB cart.
        await fetchCart()
      } catch (e) {
        console.error("Sync failed", e)
        // Keep the current in-memory cart state on failure.
      }
    } else {
      // No guest items to merge — just refresh from the DB.
      await fetchCart()
    }
  }

  const total = computed(() => {
    return cartItems.value.reduce((acc, item) => {
      return acc + (item.product?.price || 0) * item.quantity
    }, 0)
  })

  return {
    cartItems,
    isLoading,
    isCartOpen,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
    total
  }
}
