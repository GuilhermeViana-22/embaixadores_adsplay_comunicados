<script setup>
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ActionForm from '@/components/ActionForm.vue'
import PageHeader from '@/components/PageHeader.vue'
import { acaoPeopleDb, colaboradorDb, userDb } from '@/db'
import { formatDate } from '@/lib/dates'
import { actionLabels, POINTS } from '@/lib/scoring'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const types = ['treinamento', 'destaque', 'social']
const records = ref([])

function reload() {
  records.value = acaoPeopleDb.getAll().sort((a, b) => b.id - a.id).map((a) => ({
    ...a,
    names: a.participantIds.map((id) => colaboradorDb.getById(id)?.name ?? '—'),
    by: userDb.getById(a.registeredByUserId)?.name ?? '—',
  }))
}
reload()

function remove(id) {
  acaoPeopleDb.remove(id)
  reload()
}
</script>

<template>
  <PageHeader title="Ações de people" description="Treinamentos, destaques e ações sociais. Estas pontuações somam só no ranking final." />

  <Tabs default-value="treinamento">
    <TabsList>
      <TabsTrigger v-for="t in types" :key="t" :value="t">{{ actionLabels[t] }}</TabsTrigger>
    </TabsList>

    <TabsContent v-for="t in types" :key="t" :value="t" class="mt-4 space-y-6">
      <ActionForm v-if="session.can('register_action')" :type="t" @saved="reload" />
      <p v-else class="text-sm text-muted-foreground">Seu perfil não tem a permissão de registrar ações de people.</p>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Registros</h2>
        <p v-if="!records.some((r) => r.type === t)" class="text-sm text-muted-foreground">Nenhum registro ainda.</p>
        <template v-for="r in records" :key="r.id">
          <Card v-if="r.type === t">
            <CardContent class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{{ r.name }}</h3>
                <Badge variant="default">{{ r.participantIds.length * POINTS[r.type] }} pontos no total</Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                <template v-if="r.date">{{ formatDate(r.date) }} · </template>{{ r.participantIds.length }} participantes × {{ POINTS[r.type] }} pontos · registrado por {{ r.by }} · arquivo {{ r.fileName }}
              </p>
              <p class="text-sm">{{ r.names.join(', ') }}</p>
              <Button v-if="session.can('register_action')" size="sm" variant="ghost" @click="remove(r.id)">Excluir</Button>
            </CardContent>
          </Card>
        </template>
      </section>
    </TabsContent>
  </Tabs>
</template>
