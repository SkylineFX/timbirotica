<template>
  <div class="h-full flex flex-col">
    <UCard class="flex-1 flex flex-col rounded-sm bg-white" :ui="{ body: 'p-2 sm:p-2', footer: 'p-2 sm:p-2 flex-1 flex flex-col' }">
      <div class="aspect-square bg-white relative overflow-hidden">
        <USkeleton class="absolute inset-0 w-full h-full" />
      </div>
      <template #footer>
        <div class="w-full flex flex-col gap-4 h-full flex-1">
          <div class="space-y-2 min-h-[60px]">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-3/4" />
          </div>
          <div class="flex flex-col gap-2 items-start">
            <USkeleton class="h-3 w-24" />
            <USkeleton class="h-5 w-24" />
          </div>
          <div class="flex flex-col gap-2">
            <USkeleton class="h-5 w-20" />
            <USkeleton class="h-8 w-full" />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
