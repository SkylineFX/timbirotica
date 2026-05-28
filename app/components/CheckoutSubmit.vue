<script setup lang="ts">
const props = defineProps<{
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
          Sunt de acord cu <NuxtLink to="/termeni-si-conditii" target="_blank" class="text-primary underline font-medium">termenii si conditiile</NuxtLink> si <NuxtLink to="/politica-de-confidentialitate" target="_blank" class="text-primary underline font-medium">politica de confidentialitate</NuxtLink>.
        </span>
      </template>
    </UCheckbox>
    <UButton
      :loading="isSubmitting"
      :disabled="!isEmailVerified || !termsAccepted || isSubmitting"
      block
      size="xl"
      class="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-md shadow-lg transition-transform active:scale-[0.98] flex justify-center"
      @click="emit('submit')"
    >
      Plaseaza comanda
    </UButton>
  </div>
</template>
