<script setup>
import { onMounted, ref, watch } from 'vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/PageHeader.vue'
import RankingList from '@/components/RankingList.vue'
import { useAction } from '@/composables/useAction'
import { monthLabel } from '@/lib/dates'
import { rankings } from '@/services/api'

const meses = ref([])
const mes = ref('')
const linhas = ref([])
const carregando = ref(true)
const { erro, run } = useAction()

async function carregarMes() {
  if (!mes.value) return
  carregando.value = true
  const r = await run(async () => { linhas.value = await rankings.mes(`${mes.value}-01`) })
  carregando.value = false
  return r
}
onMounted(async () => {
  const r = await run(async () => { meses.value = await rankings.meses() })
  if (r.ok) mes.value = meses.value[0]
  else carregando.value = false
})
watch(mes, carregarMes)
</script>

<template>
  <PageHeader title="Ranking do mês" description="Posts do Slack (depois do prazo de 24 horas úteis) e posts externos do mês. Ações de people não entram aqui." />

  <div class="space-y-6">
    <div class="max-w-xs space-y-2">
      <Label for="mes">Mês</Label>
      <Select v-model="mes">
        <SelectTrigger id="mes" class="w-full"><SelectValue placeholder="Escolha o mês" /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="m in meses" :key="m" :value="m">{{ monthLabel(m) }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>
    <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
    <RankingList v-else :linhas="linhas" vazio="Nenhum colaborador ativo neste mês. Cadastre a lista em Configurações." />
  </div>
</template>
