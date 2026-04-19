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
  <UModal v-model:open="isOpen" :title="title" :ui="{ content: 'sm:max-w-xl p-0' }" class="rounded-md">
    <template #body>
       <div class="">
         <div class="space-y-4 mb-6">
            <div v-if="!items || items.length === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-md border border-gray-100">
               {{ emptyMessage || 'Nici o adresă salvată.' }}
            </div>

            <div v-for="item in items" :key="item.id" class="flex items-start gap-4 p-5 rounded-md border transition-all cursor-pointer group hover:bg-gray-50" :class="selectedId === item.id ? 'border-primary bg-blue-50/20' : 'border-gray-200'" @click="select(item.id)">
               <div class="mt-1 flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors bg-white" :class="selectedId === item.id ? 'border-primary bg-primary' : 'border-gray-300'">
                  <div v-if="selectedId === item.id" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
               </div>
               <div class="flex-1">
                  <slot name="item" :item="item"></slot>
               </div>
            </div>
         </div>

         <UButton color="neutral" variant="solid" class="rounded-sm font-bold px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800" @click="emit('add-new')">
           <UIcon name="i-lucide-plus" class="w-4 h-4 text-white inline align-middle"/> 
           {{ addButtonText || 'Adaugă' }}
         </UButton>
       </div>
    </template>
  </UModal>
</template>
