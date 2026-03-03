
export const useFavorites = () => {
  const { loggedIn, user } = useUserSession()
  const favorites = useState<any[]>('favorites', () => [])
  const isFavoritesOpen = useState<boolean>('favorites-open', () => false)
  const isLoading = useState<boolean>('favorites-loading', () => false)
  const toast = useToast()

  const fetchFavorites = async () => {
    if (!loggedIn.value) {
      favorites.value = []
      return
    }
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

  const addToFavorites = async (product: any) => {
    if (!loggedIn.value) {
      toast.add({ title: 'Trebuie sa fii autentificat', color: 'warning' })
      return navigateTo('/user/login')
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
      userId: user.value?.id,
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
        // Refresh to get real ID
        await fetchFavorites()
      } else {
        throw new Error((res as any).message)
      }
    } catch (e) {
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
    } catch (e) {
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
