<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/PageHeader.vue'
import PostCard from '@/components/PostCard.vue'
import { postDb } from '@/db'
import { formatDateTime } from '@/lib/dates'
import { publishDue, publishNow } from '@/lib/publishing'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const posts = ref([])

function reload() {
  posts.value = postDb.getAll().filter((p) => p.status === 'programado').sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

// Simulação: a cada 30 segundos publica o que já passou do horário aprovado.
let timer
onMounted(() => {
  publishDue()
  reload()
  timer = setInterval(() => { publishDue(); reload() }, 30000)
})
onBeforeUnmount(() => clearInterval(timer))

function publish(post) {
  publishNow(post)
  reload()
}
function backToApproval(post) {
  postDb.update(post.id, { status: 'pendente', scheduledAt: '' })
  reload()
}
</script>

<template>
  <PageHeader title="Posts programados" description="Posts aprovados, com data e horário. No horário, a publicação no Slack é simulada." />

  <div class="space-y-4">
    <p v-if="!posts.length" class="text-sm text-muted-foreground">Nenhum post programado. Os posts aparecem aqui depois que o aprovador aprova.</p>
    <PostCard v-for="post in posts" :key="post.id" :post="post">
      <template #status>
        <Badge variant="secondary">Programado para {{ formatDateTime(post.scheduledAt) }}</Badge>
      </template>
      <div v-if="session.can('approve_post')" class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" @click="publish(post)">Publicar agora (teste)</Button>
        <Button size="sm" variant="ghost" @click="backToApproval(post)">Voltar para aprovação</Button>
      </div>
    </PostCard>
  </div>
</template>
