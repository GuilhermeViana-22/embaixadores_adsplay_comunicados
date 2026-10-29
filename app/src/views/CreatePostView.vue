<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import FileField from '@/components/FileField.vue'
import PageHeader from '@/components/PageHeader.vue'
import PostCard from '@/components/PostCard.vue'
import { appConfig } from '@/config/app'
import { useAction } from '@/composables/useAction'
import { anexos, canais as canaisApi, posts as postsApi } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const canais = ref([])
const pendentes = ref([])
const carregando = ref(true)
const vazio = () => ({ titulo: '', texto: '', arte: null, data_prevista: '', canal: '' })
const form = ref(vazio())
const msg = ref('')
const rascunhos = reactive({}) // por post: horário que o Aprovador escolheu e motivo da devolução
const erros = reactive({})
const envio = useAction()
const geral = useAction()

const nomeCanal = (chave) => canais.value.find((c) => c.chave === chave)?.nome ?? chave

async function carregar() {
  const r = await geral.run(async () => {
    const [cs, ps] = await Promise.all([canaisApi.list(), postsApi.list(['pendente', 'devolvido'])])
    canais.value = cs
    pendentes.value = ps
    ps.forEach((p) => {
      if (!rascunhos[p.id]) rascunhos[p.id] = { hora: p.data_prevista ? `${p.data_prevista}T${appConfig.defaultScheduleTime}` : '', motivo: '' }
    })
  })
  carregando.value = false
  return r
}
onMounted(carregar)

async function enviar() {
  const f = form.value
  if (!f.titulo.trim() || !f.texto.trim() || !f.data_prevista || !f.canal) { envio.erro.value = 'Preencha título, texto, data e canal. A arte é opcional.'; return }
  msg.value = ''
  const r = await envio.run(async () => {
    const caminho = f.arte ? await anexos.enviar('posts', f.arte) : null
    await postsApi.create({
      titulo: f.titulo.trim(), texto: f.texto.trim(), data_prevista: f.data_prevista, canal: f.canal,
      arte_url: caminho, arte_nome: f.arte ? f.arte.name : null,
      autor_id: session.profile.id, autor_nome: session.profile.nome,
    })
  })
  if (r.ok) { form.value = vazio(); msg.value = 'Enviado para aprovação.'; await carregar() }
}

async function acao(post, fn) {
  erros[post.id] = ''
  const r = await geral.run(fn)
  if (!r.ok) erros[post.id] = geral.erro.value
  else await carregar()
}
function aprovar(post) {
  const hora = rascunhos[post.id].hora
  if (!hora) { erros[post.id] = 'Defina a data e o horário da divulgação.'; return }
  return acao(post, () => postsApi.aprovar(post.id, new Date(hora).toISOString(), session.profile.nome))
}
function devolver(post) {
  const motivo = rascunhos[post.id].motivo.trim()
  if (!motivo) { erros[post.id] = 'Escreva o motivo da devolução.'; return }
  return acao(post, () => postsApi.devolver(post.id, motivo))
}
const excluir = (post) => acao(post, () => postsApi.remove(post.id))
const podeExcluir = (post) => session.isAprovador || post.autor_id === session.profile.id
</script>

<template>
  <PageHeader title="Criação de posts" description="Anexe a arte (opcional), escreva o texto e escolha a data e o canal. Depois o post vai para aprovação." />

  <div class="space-y-8">
    <Card v-if="session.can('create_post')" class="max-w-3xl">
      <CardHeader>
        <CardTitle>Novo comunicado</CardTitle>
        <CardDescription>O nome de quem posta vem da conta logada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="enviar">
          <div class="space-y-2 md:col-span-2">
            <Label for="titulo">Título</Label>
            <Input id="titulo" v-model="form.titulo" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="texto">Texto do comunicado</Label>
            <Textarea id="texto" v-model="form.texto" />
          </div>
          <FileField id="arte" v-model="form.arte" label="Arte (opcional)" accept="image/*" />
          <div class="space-y-2">
            <Label for="data">Data prevista para divulgação</Label>
            <Input id="data" v-model="form.data_prevista" type="date" />
          </div>
          <div class="space-y-2">
            <Label for="canal">Canal de divulgação</Label>
            <Select v-model="form.canal">
              <SelectTrigger id="canal" class="w-full"><SelectValue placeholder="Escolha o canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in canais" :key="c.chave" :value="c.chave">{{ c.nome }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="autor">Postando como</Label>
            <Input id="autor" :model-value="session.profile.nome" readonly />
          </div>
          <div class="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit" :disabled="envio.ocupado.value">{{ envio.ocupado.value ? 'Enviando…' : 'Enviar para aprovação' }}</Button>
            <span v-if="msg" class="text-sm text-muted-foreground" role="status">{{ msg }}</span>
            <span v-if="envio.erro.value" class="text-sm text-destructive" role="alert">{{ envio.erro.value }}</span>
          </div>
        </form>
      </CardContent>
    </Card>
    <p v-else class="text-sm text-muted-foreground">Seu perfil não tem a permissão de criar posts.</p>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Aguardando aprovação</h2>
      <p v-if="geral.erro.value && !pendentes.length" class="text-sm text-destructive" role="alert">{{ geral.erro.value }}</p>
      <p v-else-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
      <p v-else-if="!pendentes.length" class="text-sm text-muted-foreground">Nada aguardando aprovação.</p>
      <PostCard v-for="post in pendentes" :key="post.id" :post="post" :canal="nomeCanal(post.canal)">
        <template #status>
          <Badge v-if="post.status === 'devolvido'" variant="destructive">Devolvido</Badge>
          <Badge v-else variant="outline">Aguardando o aprovador</Badge>
        </template>

        <template v-if="post.status === 'devolvido'">
          <p class="text-sm"><span class="font-medium">Motivo:</span> {{ post.motivo_devolucao }}</p>
        </template>

        <div v-else-if="session.can('approve_post')" class="space-y-3 rounded-xl bg-muted/50 p-3">
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-2">
              <Label :for="`hora-${post.id}`">Data e horário da divulgação</Label>
              <Input :id="`hora-${post.id}`" v-model="rascunhos[post.id].hora" type="datetime-local" />
            </div>
            <div class="space-y-2">
              <Label :for="`motivo-${post.id}`">Motivo (se for devolver)</Label>
              <Input :id="`motivo-${post.id}`" v-model="rascunhos[post.id].motivo" />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button size="sm" :disabled="geral.ocupado.value" @click="aprovar(post)">Aprovar e programar</Button>
            <Button size="sm" variant="outline" :disabled="geral.ocupado.value" @click="devolver(post)">Devolver</Button>
          </div>
        </div>

        <div v-if="podeExcluir(post)" class="flex">
          <Button size="sm" variant="ghost" :disabled="geral.ocupado.value" @click="excluir(post)">Excluir</Button>
        </div>
        <p v-if="erros[post.id]" class="text-sm text-destructive" role="alert">{{ erros[post.id] }}</p>
      </PostCard>
    </section>
  </div>
</template>
