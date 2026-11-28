<script setup lang="ts" generic="T extends { id: number }">
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  items: T[] | null | undefined
  selectedId: number | null
  emptyMessage?: string
  addButtonText?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:selectedId': [value: number]
  'add-new': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

function select(id: number) {
  emit('update:selectedId', id)
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'sm:max-w-xl p-0' }"
    class="rounded-md"
  >
    <template #body>
      <div class="">
        <div class="mb-6 space-y-4">
          <div
            v-if="!items || items.length === 0"
            class="rounded-md border border-gray-100 bg-gray-50 py-8 text-center text-gray-500"
          >
            {{ emptyMessage || 'Nici o adresa salvata.' }}
          </div>

          <div
            v-for="item in items"
            :key="item.id"
            class="group flex cursor-pointer items-start gap-4 rounded-md border p-5 transition-all hover:bg-gray-50"
            :class="selectedId === item.id ? 'border-primary bg-blue-50/20' : 'border-gray-200'"
            @click="select(item.id)"
          >
            <div
              class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border bg-white transition-colors"
              :class="selectedId === item.id ? 'border-primary bg-primary' : 'border-gray-300'"
            >
              <div v-if="selectedId === item.id" class="h-2.5 w-2.5 rounded-full bg-primary"></div>
            </div>
            <div class="flex-1">
              <slot name="item" :item="item"></slot>
            </div>
          </div>
        </div>

        <UButton
          color="neutral"
          variant="solid"
          class="rounded-sm bg-gray-900 px-5 py-2.5 font-bold text-white hover:bg-gray-800"
          @click="emit('add-new')"
        >
          <UIcon name="i-lucide-plus" class="inline h-4 w-4 align-middle text-white" />
          {{ addButtonText || 'Adauga' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
