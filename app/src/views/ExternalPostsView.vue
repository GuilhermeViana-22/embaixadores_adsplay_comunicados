<script setup>
import { computed, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AnexoThumb from '@/components/AnexoThumb.vue'
import FileField from '@/components/FileField.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAction } from '@/composables/useAction'
import { ativoEm } from '@/lib/colaboradores'
import { formatDate, monthLabel } from '@/lib/dates'
import { anexos, colaboradores as colabApi, externos as extApi, regras as regrasApi } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const lista = ref([])
const colabs = ref([])
const pontos = ref(0)
const carregando = ref(true)
const vazio = () => ({ rede: '', nome: '', data: '', colaboradorId: '', print: null })
const form = ref(vazio())
const msg = ref('')
const { erro, ocupado, run } = useAction()

const ativos = computed(() => colabs.value.filter((c) => c.ativo))
const nomeDe = (id) => colabs.value.find((c) => c.id === id)

async function carregar() {
  const r = await run(async () => {
    const [ex, cl, rg] = await Promise.all([extApi.list(), colabApi.list(), regrasApi.list()])
    lista.value = ex
    colabs.value = cl
    pontos.value = rg.find((x) => x.chave === 'post_externo')?.pontos ?? 0
  })
  carregando.value = false
  return r
}
onMounted(carregar)

async function registrar() {
  const f = form.value
  if (!f.rede || !f.nome.trim() || !f.data || !f.colaboradorId) { erro.value = 'Preencha a rede, o nome, a data e o colaborador. O print é opcional.'; return }
  msg.value = ''
  const r = await run(async () => {
    const caminho = f.print ? await anexos.enviar('externos', f.print) : null
    await extApi.create({
      rede: f.rede, nome: f.nome.trim(), data_publicacao: f.data, colaborador_id: f.colaboradorId,
      print_url: caminho, print_nome: f.print ? f.print.name : null, criado_por: session.profile.nome, criado_por_id: session.profile.id,
    })
  })
  if (r.ok) { form.value = vazio(); msg.value = `Registrado: +${pontos.value} pontos no mês da publicação.`; await carregar() }
}
const apagar = async (id) => { const r = await run(() => extApi.remove(id)); if (r.ok) await carregar() }
const pode = (x) => session.isAprovador || x.criado_por_id === session.profile.id
const pontua = (x) => { const c = nomeDe(x.colaborador_id); return c ? ativoEm(c, x.data_publicacao) : false }
</script>

<template>
  <PageHeader title="Post Externo" :description="`Posts do Instagram e do LinkedIn. Cada post vale ${pontos} pontos e soma no mês da data de publicação.`" />

  <div class="space-y-8">
    <Card v-if="session.can('register_external')" class="max-w-3xl">
      <CardHeader>
        <CardTitle>Novo post externo</CardTitle>
        <CardDescription>Anexe o print (opcional) e informe o nome e a data da publicação.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="registrar">
          <div class="space-y-2">
            <Label for="rede">Rede</Label>
            <Select v-model="form.rede">
              <SelectTrigger id="rede" class="w-full"><SelectValue placeholder="Escolha a rede" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="nome">Nome do post</Label>
            <Input id="nome" v-model="form.nome" />
          </div>
          <div class="space-y-2">
            <Label for="data">Data da publicação</Label>
            <Input id="data" v-model="form.data" type="date" />
          </div>
          <div class="space-y-2">
            <Label for="colab">Colaborador (nome completo)</Label>
            <Select v-model="form.colaboradorId">
              <SelectTrigger id="colab" class="w-full"><SelectValue placeholder="Escolha pelo nome completo" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in ativos" :key="c.id" :value="c.id">{{ c.nome_completo }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="md:col-span-2"><FileField id="print" v-model="form.print" label="Print do post (opcional)" accept="image/*" /></div>
          <div class="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit" :disabled="ocupado">{{ ocupado ? 'Enviando…' : 'Registrar post externo' }}</Button>
            <span v-if="msg" class="text-sm text-muted-foreground" role="status">{{ msg }}</span>
            <span v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</span>
          </div>
        </form>
      </CardContent>
    </Card>
    <p v-else class="text-sm text-muted-foreground">Seu perfil não tem a permissão de registrar posts externos.</p>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Posts registrados</h2>
      <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
      <p v-else-if="!lista.length" class="text-sm text-muted-foreground">Nenhum post externo registrado.</p>
      <Card v-for="x in lista" :key="x.id">
        <CardContent class="grid gap-4" :class="x.print_url ? 'md:grid-cols-[8rem_1fr]' : ''">
          <AnexoThumb v-if="x.print_url" :caminho="x.print_url" :nome="x.print_nome" />
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold">{{ x.nome }}</h3>
              <Badge variant="secondary">{{ x.rede }}</Badge>
            </div>
            <p class="text-sm text-muted-foreground">{{ nomeDe(x.colaborador_id)?.nome_completo ?? '—' }}, publicado em {{ formatDate(x.data_publicacao) }}</p>
            <Badge v-if="pontua(x)">+{{ pontos }} pontos em {{ monthLabel(x.data_publicacao.slice(0, 7)) }}</Badge>
            <Badge v-else variant="outline">Colaborador inativo neste mês: não pontua</Badge>
            <div v-if="pode(x)"><Button size="sm" variant="ghost" :disabled="ocupado" @click="apagar(x.id)">Excluir</Button></div>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
