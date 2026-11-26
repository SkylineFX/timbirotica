import type { InternalApi } from 'nitropack/types'

/** A favorite, as GET /api/favorites sends it. */
export type Favorite = InternalApi['/api/favorites']['get'][number]

/**
 * A product as the favorites list holds it. Product listings and the product
 * page send these fields and more, so their products can be added as they are.
 */
export type FavoriteProduct = Favorite['product']

export const useFavorites = () => {
  const { loggedIn, user } = useUserSession()
  const route = useRoute()
  const favorites = useState<Favorite[]>('favorites', () => [])
  const isFavoritesOpen = useState<boolean>('favorites-open', () => false)
  const isLoading = useState<boolean>('favorites-loading', () => false)
  const toast = useToast()

  const fetchFavorites = async () => {
    if (!loggedIn.value) {
      favorites.value = []
      return
    }
    
    // Auto-block SSR fetching (Nuxt SSR $fetch doesn't natively forward your browser cookie without proxying)
    if (import.meta.server) return
    
    // Prevent duplicated fetch spam if multiple components initialize the composable 
    if (isLoading.value || favorites.value.length > 0) return

    isLoading.value = true
    try {
      const data = await $fetch('/api/favorites')
      favorites.value = data || []
    } catch (e) {
      console.error('Failed to fetch favorites', e)
      toast.add({ title: 'Eroare la incarcarea favoritelor', color: 'error' })
    } finally {
      isLoading.value = false
    }
  }

  const addToFavorites = async (product: FavoriteProduct) => {
    // loggedIn is true exactly when the session has a user; both are checked
    // so the user's id below is known to be there.
    if (!loggedIn.value || !user.value) {
      toast.add({ title: 'Trebuie sa fii autentificat', color: 'warning' })
      // Return to this page after signing in.
      return navigateTo({ path: '/user/login', query: { redirect: route.fullPath } })
    }

    // Optimistic update
    const exists = favorites.value.some(f => f.productId === product.id)
    if (exists) {
      toast.add({ title: 'Produsul este deja la favorite', color: 'info' })
      return
    }

    // Add to local state immediately
    const tempId = Date.now() // placeholder ID
    favorites.value.unshift({
      id: tempId,
      userId: user.value.id,
      productId: product.id,
      createdAt: new Date().toISOString(),
      product: product
    })

    try {
      const res = await $fetch('/api/favorites', {
        method: 'POST',
        body: { productId: product.id }
      })
      if (res.success) {
        toast.add({ title: 'Produs adaugat la favorite', color: 'success' })
        // Swap the temporary id for the saved row's id, so removing it later
        // deletes the right row. (Refetching didn't do this: fetchFavorites
        // skips the request when the list isn't empty.)
        const item = favorites.value.find(f => f.id === tempId)
        if (item) {
          item.id = res.id
        } else {
          // Removed again while it was being saved: delete the saved row too.
          await $fetch(`/api/favorites/${res.id}`, { method: 'DELETE' }).catch(() => {})
        }
      } else {
        throw new Error('message' in res ? res.message : undefined)
      }
    } catch {
      // Rollback
      favorites.value = favorites.value.filter(f => f.id !== tempId)
      toast.add({ title: 'Eroare la adaugare', color: 'error' })
    }
  }

  const removeFromFavorites = async (favoriteId: number) => {
    // Optimistic
    const prev = [...favorites.value]
    favorites.value = favorites.value.filter(f => f.id !== favoriteId)

    try {
      await $fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE'
      })
      toast.add({ title: 'Sters de la favorite', color: 'success' })
    } catch {
      favorites.value = prev
      toast.add({ title: 'Eroare la stergere', color: 'error' })
    }
  }

  // Auto-fetch when logged in
  watch(loggedIn, (val) => {
    if (val) fetchFavorites()
    else favorites.value = []
  }, { immediate: true })

  return {
    favorites,
    isFavoritesOpen,
    isLoading,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites
  }
}
