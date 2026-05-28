<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <UMain class="flex-1 flex flex-col min-h-0">
      <slot />
    </UMain>
    <Footer />
    <CookieBanner />
  </div>
</template>
