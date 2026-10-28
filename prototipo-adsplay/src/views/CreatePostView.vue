<script setup>
import { reactive, ref } from 'vue'
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
import { canalDb, postDb } from '@/db'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const channels = canalDb.getAll()

const emptyForm = () => ({ title: '', text: '', artFileName: '', plannedDate: '', channelId: '' })
const form = ref(emptyForm())
const formMessage = ref('')

const pending = ref([])
const drafts = reactive({}) // por post: horário escolhido pelo Aprovador e motivo da devolução
const errors = reactive({})

function reload() {
  pending.value = postDb.getAll()
    .filter((p) => p.status === 'pendente' || p.status === 'devolvido')
    .sort((a, b) => b.id - a.id)
  pending.value.forEach((p) => {
    if (!drafts[p.id]) drafts[p.id] = { time: p.plannedDate ? `${p.plannedDate}T${appConfig.defaultScheduleTime}` : '', reason: '' }
  })
}
reload()

function submit() {
  const f = form.value
  if (!f.title.trim() || !f.text.trim() || !f.artFileName || !f.plannedDate || !f.channelId) {
    formMessage.value = 'Preencha título, texto, arte, data prevista e canal.'
    return
  }
  postDb.create({
    title: f.title.trim(), text: f.text.trim(), artFileName: f.artFileName, plannedDate: f.plannedDate,
    channelId: Number(f.channelId), authorUserId: session.userId, status: 'pendente',
    returnReason: '', scheduledAt: '', publishedAt: '',
  })
  form.value = emptyForm()
  formMessage.value = 'Enviado para aprovação.'
  reload()
}

function approve(post) {
  const time = drafts[post.id].time
  if (!time) { errors[post.id] = 'Defina a data e o horário da divulgação.'; return }
  errors[post.id] = ''
  postDb.update(post.id, { status: 'programado', scheduledAt: time, returnReason: '' })
  reload()
}

function sendBack(post) {
  const reason = drafts[post.id].reason.trim()
  if (!reason) { errors[post.id] = 'Escreva o motivo da devolução.'; return }
  errors[post.id] = ''
  postDb.update(post.id, { status: 'devolvido', returnReason: reason })
  reload()
}

function remove(post) {
  postDb.remove(post.id)
  reload()
}
</script>

<template>
  <PageHeader title="Criação de posts" description="Anexe a arte, escreva o texto e escolha a data e o canal. Depois o post vai para aprovação." />

  <div class="space-y-8">
    <Card v-if="session.can('create_post')" class="max-w-3xl">
      <CardHeader>
        <CardTitle>Novo comunicado</CardTitle>
        <CardDescription>O nome de quem posta vem da conta logada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
          <div class="space-y-2 md:col-span-2">
            <Label for="title">Título</Label>
            <Input id="title" v-model="form.title" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="text">Texto do comunicado</Label>
            <Textarea id="text" v-model="form.text" />
          </div>
          <FileField id="art" v-model="form.artFileName" label="Arte (imagem do card)" accept="image/*" />
          <div class="space-y-2">
            <Label for="planned">Data prevista para divulgação</Label>
            <Input id="planned" v-model="form.plannedDate" type="date" />
          </div>
          <div class="space-y-2">
            <Label for="channel">Canal de divulgação</Label>
            <Select v-model="form.channelId">
              <SelectTrigger id="channel" class="w-full"><SelectValue placeholder="Escolha o canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in channels" :key="c.id" :value="String(c.id)">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="author">Postando como</Label>
            <Input id="author" :model-value="session.user?.name" readonly />
          </div>
          <div class="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit">Enviar para aprovação</Button>
            <span v-if="formMessage" class="text-sm text-muted-foreground" role="status">{{ formMessage }}</span>
          </div>
        </form>
      </CardContent>
    </Card>
    <p v-else class="text-sm text-muted-foreground">Seu perfil não tem a permissão de criar posts.</p>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Aguardando aprovação</h2>
      <p v-if="!pending.length" class="text-sm text-muted-foreground">Nada aguardando aprovação. Envie um comunicado no formulário acima.</p>
      <PostCard v-for="post in pending" :key="post.id" :post="post">
        <template #status>
          <Badge v-if="post.status === 'devolvido'" variant="destructive">Devolvido</Badge>
          <Badge v-else variant="outline">Aguardando o aprovador</Badge>
        </template>

        <template v-if="post.status === 'devolvido'">
          <p class="text-sm"><span class="font-medium">Motivo:</span> {{ post.returnReason }}</p>
          <Button v-if="session.can('create_post')" variant="outline" size="sm" @click="remove(post)">Excluir</Button>
        </template>

        <div v-else-if="session.can('approve_post')" class="space-y-3 rounded-xl bg-muted/50 p-3">
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-2">
              <Label :for="`time-${post.id}`">Data e horário da divulgação</Label>
              <Input :id="`time-${post.id}`" v-model="drafts[post.id].time" type="datetime-local" />
            </div>
            <div class="space-y-2">
              <Label :for="`reason-${post.id}`">Motivo (se for devolver)</Label>
              <Input :id="`reason-${post.id}`" v-model="drafts[post.id].reason" />
            </div>
          </div>
          <p v-if="errors[post.id]" class="text-sm text-destructive" role="alert">{{ errors[post.id] }}</p>
          <div class="flex flex-wrap gap-2">
            <Button size="sm" @click="approve(post)">Aprovar e programar</Button>
            <Button size="sm" variant="outline" @click="sendBack(post)">Devolver</Button>
          </div>
        </div>
      </PostCard>
    </section>
  </div>
</template>
