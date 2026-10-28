<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/PageHeader.vue'
import PostCard from '@/components/PostCard.vue'
import { useAction } from '@/composables/useAction'
import { formatDateTime } from '@/lib/dates'
import { parseSlackLink } from '@/lib/slack'
import { canais as canaisApi, posts as postsApi, publicacoes } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const canais = ref([])
const programados = ref([])
const cancelados = ref([])
const carregando = ref(true)
const links = reactive({})
const erros = reactive({})
const confirmando = ref('')
const { erro, ocupado, run } = useAction()

const nomeCanal = (chave) => canais.value.find((c) => c.chave === chave)?.nome ?? chave

async function carregar() {
  const r = await run(async () => {
    const [cs, ps] = await Promise.all([canaisApi.list(), postsApi.list(['programado', 'cancelado'])])
    canais.value = cs
    programados.value = ps.filter((p) => p.status === 'programado').sort((a, b) => a.agendado_para.localeCompare(b.agendado_para))
    cancelados.value = ps.filter((p) => p.status === 'cancelado')
  })
  carregando.value = false
  return r
}
onMounted(carregar)

async function acao(post, fn) {
  erros[post.id] = ''
  const r = await run(fn)
  if (!r.ok) erros[post.id] = erro.value
  else await carregar()
}
function registrar(post) {
  const l = parseSlackLink(links[post.id] || '')
  if (!l) { erros[post.id] = 'Cole o link completo da mensagem do Slack (Copiar link da mensagem).'; return }
  return acao(post, () => publicacoes.registrar(post.id, { publicado_em: l.publicadoEm, slack_channel_id: l.channelId, slack_ts: l.ts, por: session.profile.nome }))
}
const voltar = (post) => acao(post, () => postsApi.voltar(post.id))
const excluir = (post) => acao(post, () => postsApi.remove(post.id))
function cancelar(post) {
  confirmando.value = ''
  return acao(post, () => postsApi.cancelar(post.id, session.profile.nome))
}
</script>

<template>
  <PageHeader title="Posts programados" description="Posts aprovados, com data e horário. Publique no Slack e cole aqui o link da mensagem para o sistema registrar a publicação." />

  <div class="space-y-4">
    <p v-if="erro && !programados.length && !cancelados.length" class="text-sm text-destructive" role="alert">{{ erro }}</p>
    <p v-else-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
    <p v-else-if="!programados.length" class="text-sm text-muted-foreground">Nenhum post programado. Os posts aparecem aqui depois que o aprovador aprova.</p>

    <PostCard v-for="post in programados" :key="post.id" :post="post" :canal="nomeCanal(post.canal)">
      <template #status><Badge variant="secondary">Aprovado para {{ formatDateTime(post.agendado_para) }}</Badge></template>
      <template v-if="session.can('approve_post')">
        <div class="flex flex-wrap items-end gap-2">
          <div class="min-w-56 flex-1 space-y-2">
            <Label :for="`link-${post.id}`">Link da mensagem publicada no Slack</Label>
            <Input :id="`link-${post.id}`" v-model="links[post.id]" placeholder="https://…slack.com/archives/…" />
          </div>
          <Button size="sm" :disabled="ocupado" @click="registrar(post)">Registrar publicação</Button>
        </div>
        <div v-if="confirmando === post.id" class="space-y-2 rounded-xl bg-muted/50 p-3">
          <p class="text-sm font-medium">Cancelar este post?</p>
          <p class="text-sm text-muted-foreground">Ele sai da lista de programados. Se já foi agendado no Slack, a mensagem continua lá até você excluí-la no próprio Slack.</p>
          <div class="flex gap-2">
            <Button size="sm" variant="destructive" :disabled="ocupado" @click="cancelar(post)">Confirmar cancelamento</Button>
            <Button size="sm" variant="outline" @click="confirmando = ''">Voltar</Button>
          </div>
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" :disabled="ocupado" @click="voltar(post)">Voltar para aprovação</Button>
          <Button size="sm" variant="ghost" @click="confirmando = post.id">Cancelar post</Button>
        </div>
      </template>
      <p v-if="erros[post.id]" class="text-sm text-destructive" role="alert">{{ erros[post.id] }}</p>
    </PostCard>

    <section v-if="cancelados.length" class="space-y-4 pt-4">
      <h2 class="text-lg font-semibold">Cancelados</h2>
      <PostCard v-for="post in cancelados" :key="post.id" :post="post" :canal="nomeCanal(post.canal)">
        <template #status><Badge variant="destructive">Cancelado</Badge></template>
        <p class="text-sm text-muted-foreground">Cancelado por {{ post.cancelado_por || '—' }} em {{ formatDateTime(post.cancelado_em) }}.</p>
        <div v-if="session.can('approve_post')" class="flex gap-2">
          <Button size="sm" variant="outline" :disabled="ocupado" @click="voltar(post)">Voltar para aprovação</Button>
          <Button size="sm" variant="ghost" :disabled="ocupado" @click="excluir(post)">Excluir de vez</Button>
        </div>
        <p v-if="erros[post.id]" class="text-sm text-destructive" role="alert">{{ erros[post.id] }}</p>
      </PostCard>
    </section>
  </div>
</template>
