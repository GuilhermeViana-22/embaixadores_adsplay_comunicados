<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { colaboradorDb, interacaoDb } from '@/db'
import { toLocalIso } from '@/lib/dates'

const props = defineProps({ post: { type: Object, required: true } })
const emit = defineEmits(['saved'])

const open = ref(false)
const people = colaboradorDb.getAll().filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
const empty = () => ({ colaboradorId: '', type: 'comentario', at: toLocalIso(new Date()) })
const form = ref(empty())
const error = ref('')

function save() {
  if (!form.value.colaboradorId || !form.value.at) {
    error.value = 'Escolha o colaborador e informe quando foi.'
    return
  }
  interacaoDb.create({ postId: props.post.id, colaboradorId: Number(form.value.colaboradorId), type: form.value.type, at: form.value.at })
  form.value = empty()
  error.value = ''
  open.value = false
  emit('saved')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button size="sm" variant="outline">Lançar interação</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Lançar interação</DialogTitle>
        <DialogDescription>Simula um comentário ou reação no Slack em “{{ post.title }}”. Na versão real, isso vem do Slack.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="save">
        <div class="space-y-2">
          <Label :for="`col-${post.id}`">Colaborador</Label>
          <Select v-model="form.colaboradorId">
            <SelectTrigger :id="`col-${post.id}`" class="w-full"><SelectValue placeholder="Escolha pelo nome completo" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in people" :key="c.id" :value="String(c.id)">{{ c.name }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label :for="`type-${post.id}`">Tipo</Label>
          <Select v-model="form.type">
            <SelectTrigger :id="`type-${post.id}`" class="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comentario">Comentário</SelectItem>
              <SelectItem value="reacao">Reação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label :for="`at-${post.id}`">Quando</Label>
          <Input :id="`at-${post.id}`" v-model="form.at" type="datetime-local" />
        </div>
        <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
        <Button type="submit">Lançar</Button>
      </form>
    </DialogContent>
  </Dialog>
</template>
