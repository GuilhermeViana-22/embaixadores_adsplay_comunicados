<script setup>
import { computed, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import InteractionHistory from '@/components/InteractionHistory.vue'
import LogInteractionDialog from '@/components/LogInteractionDialog.vue'
import PageHeader from '@/components/PageHeader.vue'
import PostCard from '@/components/PostCard.vue'
import { useAction } from '@/composables/useAction'
import { formatDateTime } from '@/lib/dates'
import { canais as canaisApi, colaboradores as colabApi, interacoes as interApi, posts as postsApi, publicacoes } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const canais = ref([])
const posts = ref([])
const pubs = ref({})
const inters = ref([])
const colabs = ref([])
const carregando = ref(true)
const { erro, ocupado, run } = useAction()

const nomeCanal = (chave) => canais.value.find((c) => c.chave === chave)?.nome ?? chave
const ativos = computed(() => colabs.value.filter((c) => c.ativo))

async function carregar() {
  const r = await run(async () => {
    const [cs, ps, pb, cl] = await Promise.all([canaisApi.list(), postsApi.list(['publicado']), publicacoes.list(), colabApi.list()])
    canais.value = cs
    colabs.value = cl
    pubs.value = Object.fromEntries(pb.map((p) => [p.post_id, p]))
    posts.value = ps.filter((p) => pubs.value[p.id]).sort((a, b) => pubs.value[b.id].publicado_em.localeCompare(pubs.value[a.id].publicado_em))
    inters.value = await interApi.listByPosts(posts.value.map((p) => p.id))
  })
  carregando.value = false
  return r
}
onMounted(carregar)

// Comentário vale se foi feito entre a publicação e o fim do prazo. Reação vale se foi vista até o fim do prazo.
function itens(post) {
  const pb = pubs.value[post.id]
  const ini = new Date(pb.publicado_em), fim = new Date(pb.prazo)
  return inters.value.filter((i) => i.post_id === post.id).map((i) => {
    const t = new Date(i.momento)
    return { id: i.id, nome: i.nome, tipo: i.tipo, origem: i.origem, momento: i.momento, noPrazo: i.tipo === 'comentario' ? t >= ini && t <= fim : t <= fim }
  })
}
const contagem = (post) => {
  const l = itens(post).filter((i) => i.noPrazo)
  const c = l.filter((i) => i.tipo === 'comentario').length
  return { c, r: l.length - c }
}
const remover = async (id) => { const r = await run(() => interApi.remove(id)); if (r.ok) await carregar() }
</script>

<template>
  <PageHeader title="Posts publicados" description="Comentários e reações de cada post. Só contam as interações feitas em até 24 horas úteis (sem sábado e domingo) depois da publicação." />

  <div class="space-y-4">
    <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>
    <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
    <p v-else-if="!posts.length" class="text-sm text-muted-foreground">Nenhum post publicado ainda.</p>

    <PostCard v-for="post in posts" :key="post.id" :post="post" :canal="nomeCanal(post.canal)">
      <template #status>
        <Badge variant="secondary">Publicado em {{ formatDateTime(pubs[post.id].publicado_em) }}</Badge>
        <Badge :variant="pubs[post.id].encerrado ? 'default' : 'outline'">
          {{ pubs[post.id].encerrado ? 'Pontos contabilizados' : `Prazo até ${formatDateTime(pubs[post.id].prazo)}` }}
        </Badge>
      </template>
      <p class="text-sm">
        <span class="font-semibold">{{ contagem(post).c }}</span> {{ contagem(post).c === 1 ? 'comentário' : 'comentários' }} e
        <span class="font-semibold">{{ contagem(post).r }}</span> {{ contagem(post).r === 1 ? 'reação' : 'reações' }} no prazo
      </p>
      <InteractionHistory :itens="itens(post)" :removivel="session.isAdmin" @remove="remover" />
      <LogInteractionDialog v-if="session.can('register_interaction')" :post="post" :colaboradores="ativos" @saved="carregar" />
    </PostCard>
  </div>
</template>
