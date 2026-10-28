<script setup>
defineProps({ title: { type: String, required: true }, description: { type: String, default: '' } })
</script>

<template>
  <div class="mb-6 space-y-1">
    <h1 class="text-2xl font-semibold">{{ title }}</h1>
    <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
  </div>
</template>
