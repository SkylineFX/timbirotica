<template>
  <div class="flex min-h-screen flex-col">
    <!-- Where the search preview's backdrop goes (SearchInput.vue). It must be
         inside #__nuxt, which Nuxt UI isolates, to stay under the header. Not
         #__nuxt itself: Vue then used the teleport's marker there to insert the
         error page, and the error page came out blank. -->
    <div id="search-backdrop" />
    <Header />
    <UMain class="flex min-h-0 flex-1 flex-col">
      <slot />
    </UMain>
    <Footer />
    <CookieBanner />
  </div>
</template>
