<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RosterManager from '@/components/RosterManager.vue'
import { permissionLabels, permissionsByRole, roleLabels } from '@/config/app'
import { useAction } from '@/composables/useAction'
import { canais as canaisApi, regras as regrasApi, usuarios as usuariosApi } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { colorPresets, useThemeStore } from '@/stores/theme'

const session = useSessionStore()
const theme = useThemeStore()
const modes = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

// Perfil: trocar a senha
const senha = ref({ nova: '', conf: '' })
const senhaMsg = ref('')
const trocar = useAction()
async function salvarSenha() {
  senhaMsg.value = ''
  if (senha.value.nova.length < 8) { trocar.erro.value = 'A senha precisa ter no mínimo 8 caracteres.'; return }
  if (senha.value.nova !== senha.value.conf) { trocar.erro.value = 'As duas senhas não são iguais.'; return }
  const r = await trocar.run(() => session.trocarSenha(senha.value.nova))
  if (r.ok) { senha.value = { nova: '', conf: '' }; senhaMsg.value = 'Senha alterada.' }
}

// Canais, pontos e usuários (só o Aprovador altera)
const canais = ref([])
const edicao = reactive({})
const regras = ref([])
const usuarios = ref([])
const geral = useAction()
const aviso = ref('')

async function carregar() {
  await geral.run(async () => {
    const [c, r] = await Promise.all([canaisApi.list(), regrasApi.list()])
    canais.value = c
    c.forEach((x) => { edicao[x.chave] = { id: x.slack_channel_id || '', nome: x.slack_channel_nome || '' } })
    regras.value = r.map((x) => ({ ...x, novo: x.pontos }))
    if (session.isAdmin) usuarios.value = await usuariosApi.list()
  })
}
onMounted(carregar)

async function salvarCanal(c) {
  aviso.value = ''
  const e = edicao[c.chave]
  const r = await geral.run(() => canaisApi.update(c.chave, { slack_channel_id: e.id.trim() || null, slack_channel_nome: e.nome.trim().replace(/^#/, '') || null }))
  if (r.ok) { aviso.value = `Canal “${c.nome}” salvo.`; await carregar() }
}
async function salvarRegra(r) {
  aviso.value = ''
  const n = Number(r.novo)
  if (!Number.isInteger(n) || n < 0) { geral.erro.value = 'Os pontos precisam ser um número inteiro, zero ou maior.'; return }
  const x = await geral.run(() => regrasApi.update(r.chave, n))
  if (x.ok) { aviso.value = 'Pontos salvos.'; await carregar() }
}
async function mudarUsuario(u, patch) {
  aviso.value = ''
  const x = await geral.run(() => usuariosApi.update(u.id, patch))
  if (x.ok) { await carregar(); if (u.id === session.profile.id) await session.carregarPerfil() }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Configurações</h1>
    <p v-if="geral.erro.value" class="text-sm text-destructive" role="alert">{{ geral.erro.value }}</p>
    <p v-if="aviso" class="text-sm text-muted-foreground" role="status">{{ aviso }}</p>

    <Tabs default-value="perfil">
      <TabsList class="flex-wrap">
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="permissoes">Permissões</TabsTrigger>
        <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
        <TabsTrigger value="canais">Canais do Slack</TabsTrigger>
        <TabsTrigger value="pontos">Pontuação</TabsTrigger>
        <TabsTrigger v-if="session.isAdmin" value="usuarios">Usuários</TabsTrigger>
        <TabsTrigger value="aparencia">Aparência</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil" class="mt-4 space-y-4">
        <Card class="max-w-xl">
          <CardHeader>
            <CardTitle>Seu perfil</CardTitle>
            <CardDescription>Perfil atual: {{ roleLabels[session.profile.papel] }}. Nome e papel são alterados pelo Aprovador, na aba Usuários.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2"><Label for="p-nome">Nome</Label><Input id="p-nome" :model-value="session.profile.nome" readonly /></div>
            <div class="space-y-2"><Label for="p-email">E-mail</Label><Input id="p-email" :model-value="session.profile.email" readonly /></div>
          </CardContent>
        </Card>
        <Card class="max-w-xl">
          <CardHeader><CardTitle>Trocar a senha</CardTitle></CardHeader>
          <CardContent>
            <form class="space-y-4" novalidate @submit.prevent="salvarSenha">
              <div class="space-y-2"><Label for="s-nova">Nova senha (mínimo de 8 caracteres)</Label><Input id="s-nova" v-model="senha.nova" type="password" autocomplete="new-password" /></div>
              <div class="space-y-2"><Label for="s-conf">Repita a nova senha</Label><Input id="s-conf" v-model="senha.conf" type="password" autocomplete="new-password" /></div>
              <p v-if="trocar.erro.value" class="text-sm text-destructive" role="alert">{{ trocar.erro.value }}</p>
              <p v-if="senhaMsg" class="text-sm text-muted-foreground" role="status">{{ senhaMsg }}</p>
              <Button type="submit" :disabled="trocar.ocupado.value">Salvar nova senha</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="permissoes" class="mt-4">
        <Card class="max-w-3xl">
          <CardHeader>
            <CardTitle>O que cada perfil pode fazer</CardTitle>
            <CardDescription>As regras valem no banco de dados. Para mudar o perfil de alguém, o Aprovador usa a aba Usuários.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="(chaves, papel) in permissionsByRole" :key="papel" class="space-y-2">
              <p class="font-medium">{{ roleLabels[papel] }} <Badge v-if="papel === session.profile.papel" variant="secondary">o seu</Badge></p>
              <div class="flex flex-wrap gap-2"><Badge v-for="k in chaves" :key="k" variant="outline">{{ permissionLabels[k] }}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="colaboradores" class="mt-4"><RosterManager /></TabsContent>

      <TabsContent value="canais" class="mt-4 space-y-4">
        <p class="text-sm text-muted-foreground">Defina o ID e o nome do canal do Slack de cada opção de divulgação. O ID aparece no link do canal (começa com C).</p>
        <Card v-for="c in canais" :key="c.chave" class="max-w-3xl">
          <CardHeader><CardTitle>{{ c.nome }}</CardTitle></CardHeader>
          <CardContent class="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div class="space-y-2"><Label :for="`cid-${c.chave}`">ID do canal</Label><Input :id="`cid-${c.chave}`" v-model="edicao[c.chave].id" :disabled="!session.isAdmin" placeholder="C0123456789" /></div>
            <div class="space-y-2"><Label :for="`cn-${c.chave}`">Nome do canal</Label><Input :id="`cn-${c.chave}`" v-model="edicao[c.chave].nome" :disabled="!session.isAdmin" placeholder="comunicados" /></div>
            <Button v-if="session.isAdmin" :disabled="geral.ocupado.value" @click="salvarCanal(c)">Salvar</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pontos" class="mt-4">
        <Card class="max-w-3xl">
          <CardHeader>
            <CardTitle>Pontos de cada regra</CardTitle>
            <CardDescription>Comentários e reações valem por pessoa, por post, em até 24 horas úteis. Posts externos pontuam no mês da publicação. Ações de people só no ranking final.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-for="r in regras" :key="r.chave" class="flex flex-wrap items-center gap-3">
              <span class="min-w-0 flex-1 text-sm">{{ r.descricao }}</span>
              <Input v-model="r.novo" type="number" min="0" class="w-24" :disabled="!session.isAdmin" :aria-label="`Pontos: ${r.descricao}`" />
              <Button v-if="session.isAdmin" size="sm" variant="outline" :disabled="geral.ocupado.value || Number(r.novo) === r.pontos" @click="salvarRegra(r)">Salvar</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent v-if="session.isAdmin" value="usuarios" class="mt-4 space-y-4">
        <p class="text-sm text-muted-foreground">Quem tem login neste sistema. Para criar um usuário novo, crie o login no painel do Supabase (Authentication, Users) e depois cadastre a pessoa na tabela users com o mesmo id.</p>
        <Card v-for="u in usuarios" :key="u.id" class="max-w-3xl">
          <CardContent class="flex flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ u.nome }} <Badge v-if="!u.ativo" variant="outline">desativado</Badge></p>
              <p class="text-sm text-muted-foreground">{{ u.email }}</p>
            </div>
            <Select :model-value="u.papel" :disabled="u.id === session.profile.id" @update:model-value="mudarUsuario(u, { papel: $event })">
              <SelectTrigger class="w-40" :aria-label="`Perfil de ${u.nome}`"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem v-for="(label, key) in roleLabels" :key="key" :value="key">{{ label }}</SelectItem></SelectContent>
            </Select>
            <Button v-if="u.id !== session.profile.id" size="sm" variant="outline" :disabled="geral.ocupado.value" @click="mudarUsuario(u, { ativo: !u.ativo })">{{ u.ativo ? 'Desativar' : 'Ativar' }}</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="aparencia" class="mt-4">
        <Card class="max-w-xl">
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>A escolha fica salva neste navegador.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="space-y-2">
              <Label>Modo</Label>
              <div class="flex gap-2">
                <Button v-for="m in modes" :key="m.value" :variant="theme.mode === m.value ? 'default' : 'outline'" size="sm" @click="theme.setMode(m.value)">{{ m.label }}</Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label>Cor primária</Label>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="c in colorPresets" :key="c.value" type="button" :aria-label="`Cor ${c.name}`" class="size-8 rounded-full border-2"
                  :class="theme.primary === c.value ? 'border-foreground' : 'border-transparent'" :style="{ backgroundColor: c.value }" @click="theme.setPrimary(c.value)"
                />
                <Label for="custom-color" class="ml-2 text-xs text-muted-foreground">Outra cor</Label>
                <input id="custom-color" type="color" class="h-8 w-10 cursor-pointer rounded border bg-transparent" :value="theme.primary || '#b794e8'" @input="theme.setPrimary($event.target.value)" />
              </div>
            </div>
            <Button variant="ghost" size="sm" @click="theme.reset()">Restaurar padrão</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
