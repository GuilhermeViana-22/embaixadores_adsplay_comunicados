<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FileField from '@/components/FileField.vue'
import { useAction } from '@/composables/useAction'
import { acoes, anexos } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const props = defineProps({
  tipo: { type: String, required: true }, // treinamento | destaque | social
  titulo: { type: String, required: true },
  pontos: { type: Number, default: 0 },
  colaboradores: { type: Array, required: true }, // só os ativos
})
const emit = defineEmits(['saved'])

const session = useSessionStore()
const { erro, ocupado, run } = useAction()
const ehTreino = props.tipo === 'treinamento'
const rotulos = { treinamento: 'Lista de presença', destaque: 'Lista de destaques', social: 'Planilha de participantes' }
const quarter = () => `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`
const vazio = () => ({ nome: ehTreino ? '' : quarter(), data: '', arquivo: null, ids: [] })
const form = ref(vazio())

function alternar(id) {
  const l = form.value.ids
  form.value.ids = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]
}

async function registrar() {
  const f = form.value
  if (!f.nome.trim() || (ehTreino && !f.data) || !f.ids.length) {
    erro.value = ehTreino ? 'Informe o nome e a data e marque quem participou.' : 'Informe o quarter e marque quem participou.'
    return
  }
  const r = await run(async () => {
    const caminho = f.arquivo ? await anexos.enviar('acoes', f.arquivo) : null
    await acoes.create({
      tipo: props.tipo, nome: f.nome.trim(), data_acao: ehTreino ? f.data : null,
      arquivo_url: caminho, arquivo_nome: f.arquivo ? f.arquivo.name : null,
      registrado_por: session.profile.nome, registrado_por_id: session.profile.id,
    }, f.ids)
  })
  if (r.ok) { form.value = vazio(); emit('saved') }
}
</script>

<template>
  <Card class="max-w-3xl">
    <CardHeader>
      <CardTitle>{{ titulo }}: {{ pontos }} pontos por participante</CardTitle>
      <CardDescription>Pontua só no ranking final.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="registrar">
        <div class="space-y-2">
          <Label :for="`nome-${tipo}`">{{ ehTreino ? 'Nome do treinamento' : 'Quarter' }}</Label>
          <Input :id="`nome-${tipo}`" v-model="form.nome" />
        </div>
        <div v-if="ehTreino" class="space-y-2">
          <Label :for="`data-${tipo}`">Data do treinamento</Label>
          <Input :id="`data-${tipo}`" v-model="form.data" type="date" />
        </div>
        <div class="md:col-span-2">
          <FileField :id="`arq-${tipo}`" v-model="form.arquivo" :label="`${rotulos[tipo]} (opcional)`" accept=".csv,.xlsx,.xls,.pdf,image/*" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <p class="text-sm font-medium">Quem participou ({{ form.ids.length }} marcados)</p>
          <p class="text-xs text-muted-foreground">Marque os colaboradores pelo nome completo.</p>
          <p v-if="!colaboradores.length" class="text-sm text-muted-foreground">Nenhum colaborador ativo. Cadastre a lista em Configurações.</p>
          <div class="flex flex-wrap gap-2">
            <Button v-for="c in colaboradores" :key="c.id" type="button" size="sm" :variant="form.ids.includes(c.id) ? 'default' : 'outline'" :aria-pressed="form.ids.includes(c.id)" @click="alternar(c.id)">
              {{ c.nome_completo }}
            </Button>
          </div>
        </div>
        <p v-if="erro" class="text-sm text-destructive md:col-span-2" role="alert">{{ erro }}</p>
        <div class="md:col-span-2"><Button type="submit" :disabled="ocupado">{{ ocupado ? 'Registrando…' : 'Registrar' }}</Button></div>
      </form>
    </CardContent>
  </Card>
</template>
