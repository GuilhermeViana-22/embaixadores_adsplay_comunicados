<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { colaboradorDb } from '@/db'
import { formatDateTime } from '@/lib/dates'
import { isOnTime } from '@/lib/scoring'

const props = defineProps({
  post: { type: Object, required: true },
  interactions: { type: Array, required: true },
  removable: { type: Boolean, default: false },
})
defineEmits(['remove'])

const rows = computed(() =>
  [...props.interactions]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((i) => ({ ...i, name: colaboradorDb.getById(i.colaboradorId)?.name ?? '—', onTime: isOnTime(i, props.post) })),
)
</script>

<template>
  <p v-if="!rows.length" class="text-sm text-muted-foreground">Ninguém interagiu ainda.</p>
  <ul v-else class="divide-y rounded-xl border">
    <li v-for="r in rows" :key="r.id" class="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
      <span class="font-medium">{{ r.name }}</span>
      <span class="text-muted-foreground">{{ r.type === 'comentario' ? 'comentou' : 'reagiu' }} em {{ formatDateTime(r.at) }}</span>
      <Badge :variant="r.onTime ? 'secondary' : 'outline'">{{ r.onTime ? 'no prazo' : 'fora do prazo' }}</Badge>
      <Button v-if="removable" variant="ghost" size="sm" class="ml-auto" :aria-label="`Remover interação de ${r.name}`" @click="$emit('remove', r.id)">Remover</Button>
    </li>
  </ul>
</template>
