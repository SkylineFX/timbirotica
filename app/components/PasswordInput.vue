<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  placeholder?: string
}>()

const model = defineModel<string>()
const show = ref(false)
</script>

<template>
  <UInput
    v-model="model"
    class="w-full"
    :placeholder="placeholder"
    :type="show ? 'text' : 'password'"
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="show ? 'Ascunde parola' : 'Afiseaza parola'"
        :aria-pressed="show"
        @click="show = !show"
      />
    </template>
  </UInput>
</template>
