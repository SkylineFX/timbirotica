<template>
  <div class="flex h-full flex-col">
    <UCard
      class="flex flex-1 flex-col rounded-sm bg-white"
      :ui="{ body: 'p-2 sm:p-2', footer: 'p-2 sm:p-2 flex-1 flex flex-col' }"
    >
      <div class="relative aspect-square overflow-hidden bg-white">
        <USkeleton class="absolute inset-0 h-full w-full" />
      </div>
      <template #footer>
        <div class="flex h-full w-full flex-1 flex-col gap-4">
          <div class="min-h-[60px] space-y-2">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-3/4" />
          </div>
          <div class="flex flex-col items-start gap-2">
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
