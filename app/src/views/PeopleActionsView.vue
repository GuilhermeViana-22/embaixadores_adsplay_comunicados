<script setup>
import { computed, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ActionForm from '@/components/ActionForm.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAction } from '@/composables/useAction'
import { ativoEm } from '@/lib/colaboradores'
import { formatDate } from '@/lib/dates'
import { acoes as acoesApi, colaboradores as colabApi, regras as regrasApi } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const tipos = [
  { chave: 'treinamento', nome: 'Treinamento' },
  { chave: 'destaque', nome: 'Destaque do quarter' },
  { chave: 'social', nome: 'Ação social do quarter' },
]
const lista = ref([])
const colabs = ref([])
const regras = ref({})
const carregando = ref(true)
const { erro, ocupado, run } = useAction()

const ativos = computed(() => colabs.value.filter((c) => c.ativo))
const nomeDe = (id) => colabs.value.find((c) => c.id === id)?.nome_completo ?? '—'

async function carregar() {
  const r = await run(async () => {
    const [a, c, rg] = await Promise.all([acoesApi.list(), colabApi.list(), regrasApi.list()])
    lista.value = a
    colabs.value = c
    regras.value = Object.fromEntries(rg.map((x) => [x.chave, x.pontos]))
  })
  carregando.value = false
  return r
}
onMounted(carregar)

// Participantes que de fato pontuam: estavam ativos no mês da ação.
function pontuam(a) {
  const mes = (a.data_acao || a.criado_em).slice(0, 7)
  return a.participantes.filter((id) => { const c = colabs.value.find((x) => x.id === id); return c && ativoEm(c, mes) })
}
const apagar = async (id) => { const r = await run(() => acoesApi.remove(id)); if (r.ok) await carregar() }
const pode = (a) => session.isAprovador || a.registrado_por_id === session.profile.id
</script>

<template>
  <PageHeader title="Ações de people" description="Treinamentos, destaques e ações sociais. Estas pontuações somam só no ranking final." />
  <p v-if="erro" class="mb-4 text-sm text-destructive" role="alert">{{ erro }}</p>

  <Tabs default-value="treinamento">
    <TabsList>
      <TabsTrigger v-for="t in tipos" :key="t.chave" :value="t.chave">{{ t.nome }}</TabsTrigger>
    </TabsList>

    <TabsContent v-for="t in tipos" :key="t.chave" :value="t.chave" class="mt-4 space-y-6">
      <ActionForm v-if="session.can('register_action')" :tipo="t.chave" :titulo="t.nome" :pontos="regras[t.chave] ?? 0" :colaboradores="ativos" @saved="carregar" />
      <p v-else class="text-sm text-muted-foreground">Seu perfil não tem a permissão de registrar ações de people.</p>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Registros</h2>
        <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
        <p v-else-if="!lista.some((a) => a.tipo === t.chave)" class="text-sm text-muted-foreground">Nenhum registro ainda.</p>
        <template v-for="a in lista" :key="a.id">
          <Card v-if="a.tipo === t.chave">
            <CardContent class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{{ a.nome }}</h3>
                <Badge>{{ pontuam(a).length * (regras[a.tipo] ?? 0) }} pontos no total</Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                <template v-if="a.data_acao">{{ formatDate(a.data_acao) }}, </template>{{ pontuam(a).length }} de {{ a.participantes.length }} participantes pontuam, {{ regras[a.tipo] ?? 0 }} pontos cada. Registrado por {{ a.registrado_por || '—' }}<template v-if="a.arquivo_nome">. Arquivo: {{ a.arquivo_nome }}</template>
              </p>
              <p class="text-sm">{{ a.participantes.map(nomeDe).join(', ') }}</p>
              <Button v-if="pode(a)" size="sm" variant="ghost" :disabled="ocupado" @click="apagar(a.id)">Excluir</Button>
            </CardContent>
          </Card>
        </template>
      </section>
    </TabsContent>
  </Tabs>
</template>
