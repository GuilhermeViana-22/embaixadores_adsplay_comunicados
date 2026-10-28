<script setup>
import { computed, onMounted, ref } from 'vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/PageHeader.vue'
import RankingList from '@/components/RankingList.vue'
import RosterUpload from '@/components/RosterUpload.vue'
import { monthLabel } from '@/lib/dates'
import { publishDue } from '@/lib/publishing'
import { availableMonths, computeRanking } from '@/lib/scoring'
import { useRosterStore } from '@/stores/roster'

const roster = useRosterStore()
const months = ref(availableMonths())
const month = ref(months.value[0])

onMounted(() => { publishDue(); months.value = availableMonths() })

// Recalcula quando muda o mês ou a lista de colaboradores ativos.
const rows = computed(() => {
  roster.version
  return computeRanking({ month: month.value })
})
</script>

<template>
  <PageHeader title="Ranking do mês" description="Pontos de posts do Slack (depois do prazo de 24 horas úteis) e de posts externos do mês. Ações de people não entram aqui." />

  <div class="space-y-6">
    <div class="max-w-xs space-y-2">
      <Label for="month">Mês</Label>
      <Select v-model="month">
        <SelectTrigger id="month" class="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <RankingList :rows="rows" />
    <RosterUpload />
  </div>
</template>
