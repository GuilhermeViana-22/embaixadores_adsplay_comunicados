<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import FilePlaceholder from '@/components/FilePlaceholder.vue'
import { canalDb, userDb } from '@/db'
import { formatDate } from '@/lib/dates'

const props = defineProps({ post: { type: Object, required: true } })

const channel = computed(() => canalDb.getById(props.post.channelId)?.name ?? '—')
const author = computed(() => userDb.getById(props.post.authorUserId)?.name ?? '—')
</script>

<template>
  <Card>
    <CardContent class="grid gap-4 md:grid-cols-[10rem_1fr]">
      <FilePlaceholder :name="post.artFileName" />
      <div class="min-w-0 space-y-3">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold">{{ post.title }}</h3>
            <Badge variant="secondary">{{ channel }}</Badge>
            <slot name="status" />
          </div>
          <p class="text-xs text-muted-foreground">{{ author }} · divulgação prevista em {{ formatDate(post.plannedDate) }}</p>
        </div>
        <p class="text-sm whitespace-pre-wrap">{{ post.text }}</p>
        <slot />
      </div>
    </CardContent>
  </Card>
</template>
