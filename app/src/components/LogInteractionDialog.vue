<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAction } from '@/composables/useAction'
import { toLocalIso } from '@/lib/dates'
import { interacoes } from '@/services/api'

// Lança à mão um comentário ou reação (a leitura automática do Slack não faz parte deste sistema).
const props = defineProps({ post: { type: Object, required: true }, colaboradores: { type: Array, required: true } })
const emit = defineEmits(['saved'])

const aberto = ref(false)
const { erro, ocupado, run } = useAction()
const vazio = () => ({ colaboradorId: '', tipo: 'comentario', quando: toLocalIso(new Date()) })
const form = ref(vazio())

async function salvar() {
  const c = props.colaboradores.find((x) => x.id === form.value.colaboradorId)
  if (!c || !form.value.quando) { erro.value = 'Escolha o colaborador e informe quando foi.'; return }
  if (!c.email) { erro.value = 'Este colaborador não tem e-mail cadastrado, e a pontuação do Slack usa o e-mail.'; return }
  const r = await run(() => interacoes.addManual({ post_id: props.post.id, nome: c.nome_completo, email: c.email, tipo: form.value.tipo, momento: new Date(form.value.quando).toISOString() }))
  if (r.ok) { form.value = vazio(); aberto.value = false; emit('saved') }
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogTrigger as-child><Button size="sm" variant="outline">Lançar interação</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Lançar interação</DialogTitle>
        <DialogDescription>Comentário ou reação feita no Slack em “{{ post.titulo }}”.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="salvar">
        <div class="space-y-2">
          <Label :for="`col-${post.id}`">Colaborador</Label>
          <Select v-model="form.colaboradorId">
            <SelectTrigger :id="`col-${post.id}`" class="w-full"><SelectValue placeholder="Escolha pelo nome completo" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in colaboradores" :key="c.id" :value="c.id">{{ c.nome_completo }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label :for="`tipo-${post.id}`">Tipo</Label>
          <Select v-model="form.tipo">
            <SelectTrigger :id="`tipo-${post.id}`" class="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comentario">Comentário</SelectItem>
              <SelectItem value="reacao">Reação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label :for="`quando-${post.id}`">Quando</Label>
          <Input :id="`quando-${post.id}`" v-model="form.quando" type="datetime-local" />
        </div>
        <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>
        <Button type="submit" :disabled="ocupado">Lançar</Button>
      </form>
    </DialogContent>
  </Dialog>
</template>
