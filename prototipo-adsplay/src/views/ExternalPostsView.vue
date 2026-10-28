<script setup>
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FileField from '@/components/FileField.vue'
import FilePlaceholder from '@/components/FilePlaceholder.vue'
import PageHeader from '@/components/PageHeader.vue'
import { colaboradorDb, postExternoDb } from '@/db'
import { formatDate, monthKey, monthLabel } from '@/lib/dates'
import { POINTS } from '@/lib/scoring'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const people = colaboradorDb.getAll().filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

const empty = () => ({ network: '', name: '', date: '', printFileName: '', colaboradorId: '' })
const form = ref(empty())
const message = ref('')
const posts = ref([])

function reload() {
  posts.value = postExternoDb.getAll().sort((a, b) => b.date.localeCompare(a.date))
}
reload()

const rows = computed(() => posts.value.map((p) => {
  const person = colaboradorDb.getById(p.colaboradorId)
  return { ...p, person: person?.name ?? '—', counts: !!person?.active }
}))

function submit() {
  const f = form.value
  if (!f.network || !f.name.trim() || !f.date || !f.printFileName || !f.colaboradorId) {
    message.value = 'Preencha a rede, o nome, a data, o colaborador e anexe o print.'
    return
  }
  postExternoDb.create({ network: f.network, name: f.name.trim(), date: f.date, printFileName: f.printFileName, colaboradorId: Number(f.colaboradorId) })
  form.value = empty()
  message.value = `Registrado: +${POINTS.external} pontos no mês da publicação.`
  reload()
}

function remove(id) {
  postExternoDb.remove(id)
  reload()
}
</script>

<template>
  <PageHeader title="Post Externo" :description="`Posts do Instagram e do LinkedIn. Cada post vale ${POINTS.external} pontos e soma no mês da data de publicação.`" />

  <div class="space-y-8">
    <Card v-if="session.can('register_external')" class="max-w-3xl">
      <CardHeader>
        <CardTitle>Novo post externo</CardTitle>
        <CardDescription>Anexe o print e informe o nome e a data da publicação.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
          <div class="space-y-2">
            <Label for="network">Rede</Label>
            <Select v-model="form.network">
              <SelectTrigger id="network" class="w-full"><SelectValue placeholder="Escolha a rede" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="ext-name">Nome do post</Label>
            <Input id="ext-name" v-model="form.name" />
          </div>
          <div class="space-y-2">
            <Label for="ext-date">Data da publicação</Label>
            <Input id="ext-date" v-model="form.date" type="date" />
          </div>
          <div class="space-y-2">
            <Label for="ext-person">Colaborador que publicou</Label>
            <Select v-model="form.colaboradorId">
              <SelectTrigger id="ext-person" class="w-full"><SelectValue placeholder="Escolha pelo nome completo" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in people" :key="c.id" :value="String(c.id)">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="md:col-span-2">
            <FileField id="ext-print" v-model="form.printFileName" label="Print do post" accept="image/*" />
          </div>
          <div class="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit">Registrar post externo</Button>
            <span v-if="message" class="text-sm text-muted-foreground" role="status">{{ message }}</span>
          </div>
        </form>
      </CardContent>
    </Card>
    <p v-else class="text-sm text-muted-foreground">Seu perfil não tem a permissão de registrar posts externos.</p>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Posts registrados</h2>
      <p v-if="!rows.length" class="text-sm text-muted-foreground">Nenhum post externo. Registre o primeiro no formulário acima.</p>
      <Card v-for="r in rows" :key="r.id">
        <CardContent class="grid gap-4 md:grid-cols-[8rem_1fr]">
          <FilePlaceholder :name="r.printFileName" />
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold">{{ r.name }}</h3>
              <Badge variant="secondary">{{ r.network }}</Badge>
            </div>
            <p class="text-sm text-muted-foreground">{{ r.person }} · publicado em {{ formatDate(r.date) }}</p>
            <Badge v-if="r.counts" variant="default">+{{ POINTS.external }} pontos em {{ monthLabel(monthKey(r.date)) }}</Badge>
            <Badge v-else variant="outline">Colaborador inativo: não pontua</Badge>
            <div v-if="session.can('register_external')">
              <Button size="sm" variant="ghost" @click="remove(r.id)">Excluir</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
