<script setup>
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/dates'

// itens: [{ id, nome, tipo, origem, momento, noPrazo }]
defineProps({ itens: { type: Array, required: true }, removivel: { type: Boolean, default: false } })
defineEmits(['remove'])
</script>

<template>
  <p v-if="!itens.length" class="text-sm text-muted-foreground">Ninguém interagiu ainda.</p>
  <ul v-else class="divide-y rounded-xl border">
    <li v-for="i in itens" :key="i.id" class="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
      <span class="font-medium">{{ i.nome }}</span>
      <span class="text-muted-foreground">
        {{ i.tipo === 'comentario' ? 'comentou em' : i.origem === 'slack' ? 'reação vista em' : 'reagiu em' }} {{ formatDateTime(i.momento) }}
      </span>
      <Badge :variant="i.noPrazo ? 'secondary' : 'outline'">{{ i.noPrazo ? 'no prazo' : 'fora do prazo' }}</Badge>
      <Badge v-if="i.origem === 'manual'" variant="outline">lançado à mão</Badge>
      <Button v-if="removivel && i.origem === 'manual'" variant="ghost" size="sm" class="ml-auto" :aria-label="`Remover interação de ${i.nome}`" @click="$emit('remove', i.id)">Remover</Button>
    </li>
  </ul>
</template>
