import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'
import { fromBani, sumLines } from '~~/shared/utils/money'
import { createLatestWinsSender, type LatestWinsSender } from '~~/shared/utils/latestWins'
import { nextCartQuantity } from '~~/shared/utils/cart'

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

// Adds to the cart, run one at a time. The server reads the cart line and then
// writes it, so two adds at once could insert the product twice or lose one of
// them. Each button also ignores clicks until its own add resolves (a double
// click adds once, see ADD_MIN_BUSY_MS); the queue covers adds from different
// buttons, such as two product cards. Shared by every useCart() caller in this
// browser.
let addQueue: Promise<void> = Promise.resolve()

// The shortest time addToCart takes to resolve. The "Adauga in cos" buttons
// show their spinner and ignore clicks until it does, so a guest add (saved in
// the browser at once) or a quick server answer still shows the spinner, and a
// double click adds once, signed in or not. A double click's second click
// comes 100-300 ms after the first.
const ADD_MIN_BUSY_MS = 400

// How long a cart request (an add, a quantity change, a cart read) waits for
// the server. Without a limit a request that never answers (a dropped
// connection, a stuck Worker) would hold up every add after it in the queue,
// since an add also waits for quantity changes and reads the cart back.
const CART_REQUEST_TIMEOUT_MS = 15_000

// Numbers each quantity change of a signed-in cart, so a cart read can tell
// which lines changed after it started (see fetchCart).
let quantityChangeCount = 0
const lastQuantityChange = new Map<number, number>()
const changedSince = (itemId: number, mark: number) => (lastQuantityChange.get(itemId) ?? 0) > mark

/**
 * Sends cart quantity changes still waiting, and resolves when the server has
 * answered: false if a change failed (the line is back at the quantity the
 * server holds, and a toast says so). Call it before ending the session: a
 * change sent after logout is refused and lost.
 */
export const flushCartQuantityUpdates = (): Promise<boolean> => quantityUpdates?.flush() ?? Promise.resolve(true)

export const useCart = () => {
  const { loggedIn } = useUserSession()
  const cartItems = useState<any[]>('cart-items', () => [])
  const isLoading = useState<boolean>('cart-loading', () => false)
  const isCartOpen = useState<boolean>('cart-open', () => false)
  // Set by the checkout while it places an order. The cart can't change then,
  // from any control on the page, so the order is the cart the customer sent.
  const cartLocked = useState<boolean>('cart-locked', () => false)
  const toast = useToast()

  const quantitySender = () => {
    if (quantityUpdates) return quantityUpdates
    quantityUpdates = createLatestWinsSender<number>(
      (id, value, { keepalive }) => $fetch(`/api/cart/${id}`, { method: 'PATCH', body: { quantity: value }, keepalive, timeout: CART_REQUEST_TIMEOUT_MS }),
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
    // Leaving the page within the wait would lose the last change. When the
    // page is hidden (tab switched, app backgrounded) or closed, send waiting
    // changes at once, as keepalive requests that finish after the page is
    // gone. A change still queued behind a request in flight can be lost if
    // the page closes before that request answers (one round trip).
    const sendBeforeLeaving = () => { void quantityUpdates?.flush({ keepalive: true }) }
    window.addEventListener('pagehide', sendBeforeLeaving)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendBeforeLeaving()
    })
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
        // A line changed after this read starts keeps its on-screen quantity:
        // the read can answer with the older value, before or after the change
        // reaches the server, and the change is sent anyway.
        const readStartedAt = quantityChangeCount
        // Use $fetch, not useFetch, to avoid stale cache in actions
        const data = await $fetch('/api/cart', { timeout: CART_REQUEST_TIMEOUT_MS }) as any
        if (data && data.items) {
          cartItems.value = data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: changedSince(item.id, readStartedAt)
              ? (cartItems.value.find(i => i.id === item.id)?.quantity ?? item.quantity)
              : item.quantity,
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

  // Initialize: If client-side and empty, load the guest cart. On a page load,
  // wait until hydration has finished: the server can't see localStorage and
  // renders an empty cart, so filling it during hydration made the header badge
  // differ from the server HTML ("Hydration completed but contains mismatches").
  if (import.meta.client) {
    const loadGuestCart = () => {
      const saved = localStorage.getItem('guest-cart')
      if (saved && !loggedIn.value && cartItems.value.length === 0) {
        try {
          cartItems.value = JSON.parse(saved)
        } catch { /* ignore */ }
      }
    }
    const nuxtApp = useNuxtApp()
    if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', loadGuestCart)
    else loadGuestCart()
  }

  const addToCart = async (product: any, quantity = 1): Promise<void> => {
    const add = addQueue.then(() => addOne(product, quantity))
    addQueue = add.catch(() => {}) // a failed add must not stop the ones after it
    // The wait runs alongside the add, so it delays neither the add nor the queue.
    await Promise.all([add, new Promise(resolve => setTimeout(resolve, ADD_MIN_BUSY_MS))])
  }

  const addOne = async (product: any, quantity: number) => {
    if (cartLocked.value) return
    isLoading.value = true
    try {
      if (loggedIn.value) {
        // The server adds to the quantity it holds, so send a change still
        // waiting first: sent after, it would overwrite the sum.
        await flushCartQuantityUpdates()
        await $fetch('/api/cart', {
          method: 'POST',
          body: { productId: product.id, quantity },
          timeout: CART_REQUEST_TIMEOUT_MS
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
      // No answer at all (the timeout, a dropped connection): the add may still
      // have been saved, so the message says so and the cart is read again,
      // within the queue, so the read can't land after a later add's.
      const noAnswer = loggedIn.value && !e?.response
      toast.add({
        title: 'Eroare la adaugarea in cos',
        description: noAnswer ? 'Serverul nu a raspuns. Verifica cosul inainte sa adaugi din nou.' : e?.data?.message,
        color: 'error'
      })
      if (noAnswer) await fetchCart()
    } finally {
      isLoading.value = false
    }
  }

  const removeFromCart = async (itemId: number) => {
    if (!itemId || cartLocked.value) return

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

  const updateQuantity = async (itemId: number, value: number) => {
    if (!itemId || cartLocked.value) return

    const item = cartItems.value.find(i => i.id === itemId)
    if (!item) return

    // Nothing for an emptied field or an unchanged quantity (shared/utils/cart.ts).
    const quantity = nextCartQuantity(value, item.quantity)
    if (quantity === null) return
    if (quantity === 0) {
      await removeFromCart(itemId)
      return
    }

    const previousQuantity = item.quantity
    item.quantity = quantity

    // Shown at once. A signed-in cart sends it to the server 300 ms after the
    // last change, one request per line at a time. A failure puts back the
    // quantity the server holds.
    if (loggedIn.value) {
      lastQuantityChange.set(itemId, ++quantityChangeCount)
      quantitySender().set(itemId, quantity, previousQuantity)
    }
  }

  const clearCart = () => {
    cartItems.value = []
    if (import.meta.client) {
      localStorage.removeItem('guest-cart')
    }
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

  // Added up in whole bani like the order's subtotal on the server, so checkout
  // shows the same free-shipping decision the order is charged with.
  const total = computed(() => fromBani(sumLines(cartItems.value.map(item => ({
    price: item.product?.price || 0,
    quantity: item.quantity
  })))))

  return {
    cartItems,
    isLoading,
    isCartOpen,
    cartLocked,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
    total
  }
}
