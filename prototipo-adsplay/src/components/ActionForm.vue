<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FileField from '@/components/FileField.vue'
import { acaoPeopleDb, colaboradorDb } from '@/db'
import { actionLabels, POINTS } from '@/lib/scoring'
import { useSessionStore } from '@/stores/session'

const props = defineProps({ type: { type: String, required: true } })
const emit = defineEmits(['saved'])

const session = useSessionStore()
const people = colaboradorDb.getAll().filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

const isTraining = props.type === 'treinamento'
const fileLabels = { treinamento: 'Lista de presença', destaque: 'Lista de destaques', social: 'Planilha de participantes' }
const quarter = () => `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`

const empty = () => ({ name: isTraining ? '' : quarter(), date: '', fileName: '', participantIds: [] })
const form = ref(empty())
const error = ref('')

function toggle(id) {
  const list = form.value.participantIds
  form.value.participantIds = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function submit() {
  const f = form.value
  if (!f.name.trim() || (isTraining && !f.date) || !f.fileName || !f.participantIds.length) {
    error.value = isTraining
      ? 'Informe o nome e a data, anexe a lista e marque quem consta nela.'
      : 'Informe o quarter, anexe a lista e marque quem consta nela.'
    return
  }
  acaoPeopleDb.create({
    type: props.type, name: f.name.trim(), date: isTraining ? f.date : '', fileName: f.fileName,
    participantIds: f.participantIds, registeredByUserId: session.userId,
  })
  form.value = empty()
  error.value = ''
  emit('saved')
}
</script>

<template>
  <Card class="max-w-3xl">
    <CardHeader>
      <CardTitle>{{ actionLabels[type] }}: {{ POINTS[type] }} pontos por participante</CardTitle>
      <CardDescription>Pontua só no ranking final.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <div class="space-y-2">
          <Label :for="`name-${type}`">{{ isTraining ? 'Nome do treinamento' : 'Quarter' }}</Label>
          <Input :id="`name-${type}`" v-model="form.name" />
        </div>
        <div v-if="isTraining" class="space-y-2">
          <Label :for="`date-${type}`">Data do treinamento</Label>
          <Input :id="`date-${type}`" v-model="form.date" type="date" />
        </div>
        <div class="md:col-span-2">
          <FileField :id="`file-${type}`" v-model="form.fileName" :label="`${fileLabels[type]} (.xlsx ou .csv)`" accept=".xlsx,.xls,.csv" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <p class="text-sm font-medium">Quem consta na lista ({{ form.participantIds.length }} marcados)</p>
          <p class="text-xs text-muted-foreground">O protótipo não lê a planilha. Marque os nomes que estão nela.</p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="c in people"
              :key="c.id"
              type="button"
              size="sm"
              :variant="form.participantIds.includes(c.id) ? 'default' : 'outline'"
              :aria-pressed="form.participantIds.includes(c.id)"
              @click="toggle(c.id)"
            >
              {{ c.name }}
            </Button>
          </div>
        </div>
        <p v-if="error" class="text-sm text-destructive md:col-span-2" role="alert">{{ error }}</p>
        <div class="md:col-span-2">
          <Button type="submit">Registrar</Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
