<script setup>
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import FileField from '@/components/FileField.vue'
import { colaboradorDb } from '@/db'
import { formatDateTime, toLocalIso } from '@/lib/dates'
import { useRosterStore } from '@/stores/roster'
import { useSessionStore } from '@/stores/session'

const roster = useRosterStore()
const session = useSessionStore()

const fileName = ref('')
const message = ref('')

// Lê a lista a cada mudança (roster.version) porque o model não é reativo.
const people = computed(() => {
  roster.version
  return colaboradorDb.getAll().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})
const activeCount = computed(() => people.value.filter((p) => p.active).length)

function register() {
  if (!fileName.value) {
    message.value = 'Anexe a planilha de colaboradores ativos.'
    return
  }
  // Simulação: a planilha não é lida. A lista de exemplo continua valendo.
  roster.register(fileName.value)
  message.value = `Lista "${fileName.value}" cadastrada (simulação). O ranking usa os ${activeCount.value} colaboradores ativos abaixo.`
  fileName.value = ''
}

function toggle(person) {
  colaboradorDb.update(person.id, { active: !person.active })
  roster.touch()
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Colaboradores ativos</CardTitle>
      <CardDescription>
        O ranking considera só quem está cadastrado como ativo: {{ activeCount }} colaboradores.
        <template v-if="roster.fileName"> Última lista: {{ roster.fileName }} em {{ formatDateTime(toLocalIso(new Date(roster.registeredAt))) }}.</template>
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div v-if="session.can('manage_roster')" class="space-y-3">
        <FileField id="roster-file" v-model="fileName" label="Planilha de colaboradores ativos (.xlsx ou .csv)" accept=".xlsx,.xls,.csv" />
        <Button @click="register">Cadastrar lista</Button>
        <p v-if="message" class="text-sm text-muted-foreground" role="status">{{ message }}</p>
      </div>
      <p v-else class="text-sm text-muted-foreground">Só o Aprovador cadastra a lista de colaboradores ativos.</p>

      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline" size="sm">Ver colaboradores cadastrados</Button>
        </DialogTrigger>
        <DialogContent class="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Colaboradores cadastrados</DialogTitle>
            <DialogDescription>
              <template v-if="session.can('manage_roster')">Para testar o efeito no ranking, ative ou desative alguém.</template>
              <template v-else>Lista usada no cálculo do ranking.</template>
            </DialogDescription>
          </DialogHeader>
          <ul class="divide-y">
            <li v-for="p in people" :key="p.id" class="flex items-center gap-2 py-2 text-sm">
              <span class="flex-1">{{ p.name }}</span>
              <Badge :variant="p.active ? 'secondary' : 'outline'">{{ p.active ? 'ativo' : 'inativo' }}</Badge>
              <Button v-if="session.can('manage_roster')" variant="ghost" size="sm" @click="toggle(p)">{{ p.active ? 'Desativar' : 'Ativar' }}</Button>
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
