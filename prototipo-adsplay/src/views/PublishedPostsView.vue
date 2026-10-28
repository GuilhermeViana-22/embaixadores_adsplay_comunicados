<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import InteractionHistory from '@/components/InteractionHistory.vue'
import LogInteractionDialog from '@/components/LogInteractionDialog.vue'
import PageHeader from '@/components/PageHeader.vue'
import PostCard from '@/components/PostCard.vue'
import { interacaoDb, postDb } from '@/db'
import { formatDateTime } from '@/lib/dates'
import { publishDue } from '@/lib/publishing'
import { deadlineLabel, isClosed } from '@/lib/scoring'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const items = ref([])

function reload() {
  const interactions = interacaoDb.getAll()
  items.value = postDb.getAll()
    .filter((p) => p.status === 'publicado')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((post) => {
      const list = interactions.filter((i) => i.postId === post.id)
      const comments = list.filter((i) => i.type === 'comentario').length
      return { post, list, comments, reactions: list.length - comments, closed: isClosed(post) }
    })
}

let timer
onMounted(() => {
  publishDue()
  reload()
  timer = setInterval(() => { publishDue(); reload() }, 30000)
})
onBeforeUnmount(() => clearInterval(timer))

function removeInteraction(id) {
  interacaoDb.remove(id)
  reload()
}
</script>

<template>
  <PageHeader title="Posts publicados" description="Comentários e reações de cada post, com o histórico de quem interagiu. Os pontos entram depois de 24 horas úteis, sem contar sábado e domingo." />

  <div class="space-y-4">
    <p v-if="!items.length" class="text-sm text-muted-foreground">Nenhum post publicado ainda.</p>
    <PostCard v-for="item in items" :key="item.post.id" :post="item.post">
      <template #status>
        <Badge variant="secondary">Publicado em {{ formatDateTime(item.post.publishedAt) }}</Badge>
        <Badge :variant="item.closed ? 'default' : 'outline'">{{ item.closed ? 'Pontos contabilizados' : `Prazo até ${formatDateTime(deadlineLabel(item.post))}` }}</Badge>
      </template>
      <p class="text-sm"><span class="font-semibold">{{ item.comments }}</span> comentários · <span class="font-semibold">{{ item.reactions }}</span> reações</p>
      <InteractionHistory :post="item.post" :interactions="item.list" :removable="session.can('register_interaction')" @remove="removeInteraction" />
      <LogInteractionDialog v-if="session.can('register_interaction')" :post="item.post" @saved="reload" />
    </PostCard>
  </div>
</template>
