<script setup>
import { computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import RankingList from '@/components/RankingList.vue'
import RosterUpload from '@/components/RosterUpload.vue'
import { publishDue } from '@/lib/publishing'
import { computeRanking } from '@/lib/scoring'
import { useRosterStore } from '@/stores/roster'

const roster = useRosterStore()

onMounted(() => publishDue())

// Recalcula quando a lista de colaboradores ativos muda.
const rows = computed(() => {
  roster.version
  return computeRanking()
})
</script>

<template>
  <PageHeader title="Ranking final" description="Soma de todos os meses (posts do Slack e posts externos) mais as ações de people." />

  <div class="space-y-6">
    <RankingList :rows="rows" show-actions />
    <RosterUpload />
  </div>
</template>
