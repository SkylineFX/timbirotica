<script setup lang="ts">
defineProps<{
  termsAccepted: boolean
  isSubmitting: boolean
  isEmailVerified: boolean
}>()

const emit = defineEmits<{
  'update:termsAccepted': [value: boolean]
  submit: []
}>()

// Pass-through so the parent can `v-model:terms-accepted="termsAccepted"`
const onCheckboxUpdate = (value: boolean | 'indeterminate') => {
  emit('update:termsAccepted', value === true)
}
</script>

<template>
  <div>
    <UCheckbox :model-value="termsAccepted" class="mb-4" @update:model-value="onCheckboxUpdate">
      <template #label>
        <span class="text-sm text-gray-700">
          Sunt de acord cu
          <NuxtLink
            to="/termeni-si-conditii"
            target="_blank"
            class="font-medium text-primary underline"
            >termenii si conditiile</NuxtLink
          >
          si
          <NuxtLink
            to="/politica-de-confidentialitate"
            target="_blank"
            class="font-medium text-primary underline"
            >politica de confidentialitate</NuxtLink
          >.
        </span>
      </template>
    </UCheckbox>
    <UButton
      :loading="isSubmitting"
      :disabled="!isEmailVerified || !termsAccepted || isSubmitting"
      block
      size="xl"
      class="flex w-full justify-center rounded-md bg-black py-4 text-lg font-bold text-white shadow-lg transition-transform hover:bg-gray-800 active:scale-[0.98]"
      @click="emit('submit')"
    >
      Plaseaza comanda
    </UButton>
  </div>
</template>
