<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const props = defineProps({
  rows: { type: Array, required: true },
  showActions: { type: Boolean, default: false },
})

const max = computed(() => Math.max(1, ...props.rows.map((r) => r.total)))
</script>

<template>
  <Card>
    <CardContent>
      <p v-if="!rows.length" class="py-6 text-center text-sm text-muted-foreground">Nenhum colaborador ativo cadastrado.</p>
      <div v-else class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">#</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead class="text-right">Posts do Slack</TableHead>
              <TableHead class="text-right">Posts externos</TableHead>
              <TableHead v-if="showActions" class="text-right">Ações de people</TableHead>
              <TableHead class="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(r, i) in rows" :key="r.colaborador.id">
              <TableCell class="font-semibold text-muted-foreground">{{ i + 1 }}</TableCell>
              <TableCell>
                <div class="font-medium">{{ r.colaborador.name }}</div>
                <div class="mt-1 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div class="h-full rounded-full bg-primary" :style="{ width: `${(r.total / max) * 100}%` }" />
                </div>
              </TableCell>
              <TableCell class="text-right">{{ r.slack }}</TableCell>
              <TableCell class="text-right">{{ r.external }}</TableCell>
              <TableCell v-if="showActions" class="text-right">{{ r.actions }}</TableCell>
              <TableCell class="text-right text-base font-semibold">{{ r.total }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
