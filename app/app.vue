<script setup>
useHead({
  bodyAttrs: {
    class: 'bg-slate-100 min-h-screen'
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