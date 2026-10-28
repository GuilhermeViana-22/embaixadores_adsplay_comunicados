<script setup>
import { onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import FileField from '@/components/FileField.vue'
import { useAction } from '@/composables/useAction'
import { lerTexto, parseColaboradores, parseCsv } from '@/lib/csv'
import { formatDateTime, monthLabel } from '@/lib/dates'
import { colaboradores } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const lista = ref([])
const historico = ref([])
const arquivo = ref(null)
const pendente = ref(null) // { lista, semEmail, nomeArquivo, previa }
const msg = ref('')
const { erro, ocupado, run } = useAction()

async function carregar() {
  await run(async () => {
    const [c, h] = await Promise.all([colaboradores.list(), colaboradores.historico()])
    lista.value = c
    historico.value = h
  })
}
onMounted(carregar)

const ativos = () => lista.value.filter((c) => c.ativo).length

async function ler() {
  msg.value = ''
  const f = arquivo.value
  if (!f) { erro.value = 'Anexe a planilha de colaboradores.'; return }
  if (/\.xlsx?$/i.test(f.name)) { erro.value = 'Este sistema lê arquivos CSV. No Excel, use Arquivo > Salvar como > CSV e anexe o arquivo salvo.'; return }
  const r = await run(async () => {
    const { lista: l, semEmail } = parseColaboradores(parseCsv(await lerTexto(f)))
    if (!l.length) throw new Error('Não encontrei colaboradores. Use uma linha por pessoa, com colunas de nome completo e e-mail.')
    pendente.value = { lista: l, semEmail, nomeArquivo: f.name, previa: await colaboradores.previa(l) }
  })
  if (!r.ok) pendente.value = null
}

async function confirmar() {
  const p = pendente.value
  if (!p) return
  const r = await run(() => colaboradores.aplicar(p.lista, p.nomeArquivo, session.profile.nome))
  if (r.ok) {
    msg.value = `Lista cadastrada: ${r.dados.novos} novos, ${r.dados.saem} passaram a inativos, ${r.dados.voltam} voltaram.`
    pendente.value = null
    arquivo.value = null
    await carregar()
  }
}

const alternar = async (c) => { const r = await run(() => colaboradores.alternar(c)); if (r.ok) await carregar() }
const nomes = (a) => a.join(', ')
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Colaboradores ativos</CardTitle>
      <CardDescription>
        {{ lista.length ? `${ativos()} ativos e ${lista.length - ativos()} inativos.` : 'Nenhuma lista cadastrada: sem ela os rankings ficam vazios.' }}
        Ao cadastrar uma lista nova, quem não estiver nela passa a inativo: fica em cinza no fim do ranking final e mantém o histórico dos meses em que estava ativo.
        A pontuação do Slack usa o e-mail; posts externos e ações de people usam o nome completo.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <template v-if="session.can('manage_roster')">
        <FileField id="lista" v-model="arquivo" label="Nova lista (.csv, com nome completo e e-mail)" accept=".csv,text/csv" hint="No Excel: Arquivo > Salvar como > CSV." />
        <Button :disabled="ocupado" @click="ler">Ler lista</Button>
      </template>
      <p v-else class="text-sm text-muted-foreground">Só o Aprovador cadastra a lista de colaboradores ativos.</p>
      <p v-if="msg" class="text-sm text-muted-foreground" role="status">{{ msg }}</p>
      <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>

      <div v-if="pendente" class="space-y-2 rounded-xl bg-muted/50 p-4">
        <p><b>{{ pendente.previa.total }}</b> pessoas na lista “{{ pendente.nomeArquivo }}”.<template v-if="pendente.previa.primeira"> É a primeira lista: todos entram desde o início do histórico.</template></p>
        <p v-if="pendente.previa.novos.length && !pendente.previa.primeira" class="text-sm">Novos, entram a partir deste mês: {{ nomes(pendente.previa.novos) }}</p>
        <p v-if="pendente.previa.voltam.length" class="text-sm">Voltam a ficar ativos: {{ nomes(pendente.previa.voltam) }}</p>
        <p v-if="pendente.previa.saem.length" class="text-sm text-destructive">Passam a inativos, por não estarem na lista nova ({{ pendente.previa.saem.length }}): {{ nomes(pendente.previa.saem) }}</p>
        <p v-else class="text-sm">Ninguém passa a inativo.</p>
        <p v-if="pendente.semEmail" class="text-sm text-destructive">{{ pendente.semEmail }} sem e-mail: não pontuam no Slack.</p>
        <div class="flex gap-2">
          <Button :disabled="ocupado" @click="confirmar">Confirmar atualização</Button>
          <Button variant="outline" @click="pendente = null">Cancelar</Button>
        </div>
      </div>

      <details v-if="lista.length">
        <summary class="cursor-pointer text-sm text-muted-foreground">Ver colaboradores cadastrados ({{ lista.length }})</summary>
        <ul class="mt-2 divide-y rounded-xl border">
          <li v-for="c in lista" :key="c.id" class="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
            <span class="flex-1">{{ c.nome_completo }} <span class="text-xs text-muted-foreground">{{ c.email || 'sem e-mail' }}</span></span>
            <Badge :variant="c.ativo ? 'secondary' : 'outline'">{{ c.ativo ? 'ativo' : `inativo${c.ultimoMes ? ', último mês: ' + monthLabel(c.ultimoMes.slice(0, 7)) : ''}` }}</Badge>
            <Button v-if="session.can('manage_roster')" variant="ghost" size="sm" :disabled="ocupado" @click="alternar(c)">{{ c.ativo ? 'Desativar' : 'Ativar' }}</Button>
          </li>
        </ul>
      </details>
      <details v-if="historico.length">
        <summary class="cursor-pointer text-sm text-muted-foreground">Histórico de atualizações da lista</summary>
        <ul class="mt-2 divide-y rounded-xl border">
          <li v-for="h in historico" :key="h.id" class="px-3 py-2 text-sm">{{ formatDateTime(h.criado_em) }}, {{ h.arquivo }} por {{ h.feito_por || '—' }}: {{ h.novos }} novos, {{ h.saem }} passaram a inativos, {{ h.voltam }} voltaram</li>
        </ul>
      </details>
    </CardContent>
  </Card>
</template>
