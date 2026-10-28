<script setup>
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import AnexoThumb from '@/components/AnexoThumb.vue'
import { formatDate } from '@/lib/dates'

defineProps({
  post: { type: Object, required: true },
  canal: { type: String, default: '—' }, // nome do canal, já resolvido pela tela
})
</script>

<template>
  <Card>
    <CardContent class="grid gap-4" :class="post.arte_url ? 'md:grid-cols-[10rem_1fr]' : ''">
      <AnexoThumb v-if="post.arte_url" :caminho="post.arte_url" :nome="post.arte_nome" />
      <div class="min-w-0 space-y-3">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold">{{ post.titulo }}</h3>
            <Badge variant="secondary">{{ canal }}</Badge>
            <slot name="status" />
          </div>
          <p class="text-xs text-muted-foreground">{{ post.autor_nome }}, divulgação prevista em {{ formatDate(post.data_prevista) }}</p>
        </div>
        <p class="text-sm whitespace-pre-wrap">{{ post.texto }}</p>
        <slot />
      </div>
    </CardContent>
  </Card>
</template>
