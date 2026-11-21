import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'
import { roundToBani } from '~~/shared/constants/order'
import { createLatestWinsSender, type LatestWinsSender } from '~~/shared/utils/latestWins'

// The guest-cart merge currently running in this browser, shared by every
// useCart() caller. Two merges at once would add the guest quantities twice.
let guestCartMerge: Promise<void> | null = null

// Quantity changes of a signed-in cart (shared/utils/latestWins.ts). Each line's
// change is sent once no change came for QUANTITY_SEND_DELAY_MS, so a burst of
// clicks or a held +/- button is one request, and one request at a time per
// line, so the server always ends on the last value. Shared by every useCart()
// caller in this browser; created on first use, client only.
let quantityUpdates: LatestWinsSender<number> | null = null

// Shopify's themes wait 300 ms; Baymard suggests 200-300 ms for a stepper.
const QUANTITY_SEND_DELAY_MS = 300

export const useCart = () => {
  const { loggedIn } = useUserSession()
  const cartItems = useState<any[]>('cart-items', () => [])
  const isLoading = useState<boolean>('cart-loading', () => false)
  const isCartOpen = useState<boolean>('cart-open', () => false)
  const toast = useToast()

  const quantitySender = () => {
    quantityUpdates ??= createLatestWinsSender<number>(
      (id, value) => $fetch(`/api/cart/${id}`, { method: 'PATCH', body: { quantity: value } }),
      (id, confirmed, e) => {
        console.error('Failed to update quantity', e)
        // A line removed meanwhile needs no correction or message.
        const line = cartItems.value.find(i => i.id === id)
        if (!line) return
        // Show the quantity the server still holds.
        line.quantity = confirmed
        toast.add({ title: 'Nu s-a putut actualiza cantitatea', description: (e as any)?.data?.message, color: 'error' })
      },
      { delayMs: QUANTITY_SEND_DELAY_MS }
    )
    return quantityUpdates
  }

  // Explicitly fetch cart using $fetch (no caching issues)
  const fetchCart = async () => {
    isLoading.value = true
    try {
      if (loggedIn.value) {
        // Finish quantity changes still on their way first, so the cart read
        // back (on the checkout page, before an order, after "Adauga in cos")
        // has them.
        await quantityUpdates?.flush()
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
        // Guest Logic. Cap at the same maximum the server applies to a
        // logged-in cart, so a guest line never exceeds it.
        const existing = cartItems.value.find(item => item.productId === product.id)
        if (existing) {
          existing.quantity = Math.min(existing.quantity + quantity, CART_MAX_QUANTITY)
        } else {
          cartItems.value.push({
            id: Date.now(), // Temp ID
            productId: product.id,
            quantity: Math.min(quantity, CART_MAX_QUANTITY),
            product: product
          })
        }
      }
      toast.add({ title: 'Produs adaugat in cos', color: 'success' })
    } catch (e: any) {
      console.error('Failed to add to cart', e)
      toast.add({ title: 'Eroare la adaugarea in cos', description: e?.data?.message, color: 'error' })
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
        // A quantity change still on its way would reach a deleted line.
        await quantityUpdates?.cancel(itemId)
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

    quantity = Math.min(quantity, CART_MAX_QUANTITY)
    const previousQuantity = item.quantity
    item.quantity = quantity

    // Shown at once. A signed-in cart sends it to the server 300 ms after the
    // last change, one request per line at a time. A failure puts back the
    // quantity the server holds.
    if (loggedIn.value) quantitySender().set(itemId, quantity, previousQuantity)
  }

  const clearCart = () => {
    cartItems.value = []
    if (import.meta.client) {
      localStorage.removeItem('guest-cart')
    }
  }

  const clearServerCart = async () => {
    if (loggedIn.value) {
      await $fetch('/api/cart', { method: 'DELETE' })
    }
    clearCart()
  }

  /**
   * Merge the browser's guest cart into the signed-in user's cart, then load
   * the cart from the server. Safe to call from several places at once
   * (sign-in watcher, login page, checkout): callers share one merge.
   */
  const syncCart = (): Promise<void> => {
    if (!import.meta.client || !loggedIn.value) return Promise.resolve()
    guestCartMerge ??= mergeGuestCart().finally(() => { guestCartMerge = null })
    return guestCartMerge
  }

  const mergeGuestCart = async () => {
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

  // Rounded to bani like the order's subtotal on the server, so checkout shows
  // the same free-shipping decision the order is charged with.
  const total = computed(() => roundToBani(cartItems.value.reduce((acc, item) => {
    return acc + (item.product?.price || 0) * item.quantity
  }, 0)))

  return {
    cartItems,
    isLoading,
    isCartOpen,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearServerCart,
    syncCart,
    total
  }
}
