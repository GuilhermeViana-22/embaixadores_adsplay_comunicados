<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// linhas do ranking do mês: { nome_completo, slack, externos, total }
// linhas do ranking final: + treinamento, destaque, social, ativo_agora
const props = defineProps({
  linhas: { type: Array, required: true },
  final: { type: Boolean, default: false },
  vazio: { type: String, default: 'Nenhum colaborador neste período.' },
})
const total = (r) => (props.final ? r.total : r.total)
const max = computed(() => Math.max(1, ...props.linhas.map(total)))
const cinza = (r) => props.final && r.ativo_agora === false
</script>

<template>
  <Card>
    <CardContent>
      <p v-if="!linhas.length" class="py-6 text-center text-sm text-muted-foreground">{{ vazio }}</p>
      <div v-else class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-10 text-center">#</TableHead>
              <TableHead class="text-center">Colaborador</TableHead>
              <TableHead class="text-center">Posts do Slack</TableHead>
              <TableHead class="text-center">Posts externos</TableHead>
              <template v-if="final">
                <TableHead class="text-center">Treinamento</TableHead>
                <TableHead class="text-center">Destaque do quarter</TableHead>
                <TableHead class="text-center">Ação social</TableHead>
              </template>
              <TableHead class="text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(r, i) in linhas" :key="r.colaborador_id" :class="cinza(r) ? 'text-muted-foreground' : ''">
              <TableCell class="text-center font-semibold text-muted-foreground">{{ i + 1 }}</TableCell>
              <TableCell class="whitespace-normal">
                <span class="font-medium">{{ r.nome_completo }}</span>
                <Badge v-if="cinza(r)" variant="outline" class="ml-2">inativo</Badge>
                <div class="mt-1 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div class="h-full rounded-full" :class="cinza(r) ? 'bg-muted-foreground' : 'bg-primary'" :style="{ width: `${(total(r) / max) * 100}%` }" />
                </div>
              </TableCell>
              <TableCell class="text-center">{{ r.slack }}</TableCell>
              <TableCell class="text-center">{{ r.externos }}</TableCell>
              <template v-if="final">
                <TableCell class="text-center">{{ r.treinamento }}</TableCell>
                <TableCell class="text-center">{{ r.destaque }}</TableCell>
                <TableCell class="text-center">{{ r.social }}</TableCell>
              </template>
              <TableCell class="text-center text-base font-semibold">{{ total(r) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
