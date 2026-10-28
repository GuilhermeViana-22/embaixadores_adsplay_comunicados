<script setup>
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import RankingList from '@/components/RankingList.vue'
import { useAction } from '@/composables/useAction'
import { rankings } from '@/services/api'

const linhas = ref([])
const carregando = ref(true)
const { erro, run } = useAction()

onMounted(async () => {
  await run(async () => { linhas.value = await rankings.final() })
  carregando.value = false
})
</script>

<template>
  <PageHeader title="Ranking final" description="Soma de todos os meses (Slack e posts externos) mais as ações de people, com treinamento, destaque do quarter e ação social em colunas separadas. Quem saiu da lista de ativos fica no fim, em cinza." />

  <div class="space-y-6">
    <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>
    <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
    <RankingList v-else :linhas="linhas" final vazio="Nenhum colaborador cadastrado. Cadastre a lista em Configurações." />
  </div>
</template>
