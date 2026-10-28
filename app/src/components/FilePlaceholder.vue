<script setup>
import { ImageIcon } from '@lucide/vue'

defineProps({ name: { type: String, default: '' } })
</script>

<template>
  <div class="flex aspect-square w-32 flex-col items-center md:w-full justify-center gap-2 rounded-xl bg-muted p-3 text-center text-muted-foreground">
    <ImageIcon class="size-8" aria-hidden="true" />
    <span class="text-xs break-all">{{ name }}</span>
  </div>
</template>
