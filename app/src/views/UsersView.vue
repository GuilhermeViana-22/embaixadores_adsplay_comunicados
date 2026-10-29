<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { CircleAlert, Copy, KeyRound, ShieldCheck, UserPlus } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PageHeader from '@/components/PageHeader.vue'
import { roleLabels } from '@/config/app'
import { useAction } from '@/composables/useAction'
import { formatDate } from '@/lib/dates'
import { usuarios } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const lista = ref([])
const carregando = ref(true)
const { erro, ocupado, run } = useAction()

const total = computed(() => lista.value.length)
const admins = computed(() => lista.value.filter((u) => u.admin && u.ativo).length)
const souEu = (u) => u.id === session.profile.id

async function carregar() {
  const r = await run(async () => { lista.value = await usuarios.list() })
  carregando.value = false
  return r
}
onMounted(carregar)

// Ação delicada pede confirmação na própria linha: { id, tipo }
const pendente = ref(null)
const textoConfirmacao = {
  desativar: 'Desativar o acesso? A pessoa deixa de entrar no sistema e some das listas.',
  admin_on: 'Tornar administrador? Passa a criar e gerenciar usuários, e o perfil vira Aprovador.',
  admin_off: 'Remover o administrador? Continua como Aprovador, mas não gerencia mais usuários.',
  senha: 'Gerar uma senha temporária nova? A senha atual deixa de valer e a pessoa terá de trocar a nova no próximo acesso.',
}
const pedir = (u, tipo) => { pendente.value = { id: u.id, tipo } }
const emConfirmacao = (u) => pendente.value && pendente.value.id === u.id

async function aplicar(u, patch) {
  const r = await run(() => usuarios.update(u.id, patch))
  if (r.ok) await carregar()
}
const mudarPerfil = (u, papel) => aplicar(u, u.admin && papel === 'people' ? { papel, admin: false } : { papel })
const ativar = (u) => aplicar(u, { ativo: true })

// Senha temporária: aparece uma única vez, depois de criar o usuário ou de redefinir a senha.
const senhaNova = ref(null) // { titulo, nome, email, senha }
const copiado = ref('')
async function copiar() {
  try { await navigator.clipboard.writeText(senhaNova.value.senha); copiado.value = 'Senha copiada.' }
  catch { copiado.value = 'Não consegui copiar sozinho. Selecione a senha e copie.' }
}

async function confirmar(u) {
  const tipo = pendente.value.tipo
  pendente.value = null
  if (tipo === 'desativar') return aplicar(u, { ativo: false })
  if (tipo === 'admin_on') return aplicar(u, { admin: true, papel: 'aprovador' })
  if (tipo === 'admin_off') return aplicar(u, { admin: false })
  if (tipo === 'senha') {
    const r = await run(() => usuarios.redefinirSenha(u.id))
    if (r.ok) { copiado.value = ''; senhaNova.value = { titulo: 'Senha temporária redefinida', nome: u.nome, email: u.email, senha: r.dados.senhaTemporaria } }
  }
}

// Novo usuário
const aberto = ref(false)
const vazio = () => ({ nome: '', email: '', papel: 'people', admin: false })
const form = ref(vazio())
const erroForm = ref('')
const criando = useAction()

// Marcar Administrador fixa o perfil em Aprovador; desmarcar devolve o perfil que estava escolhido.
let papelAntes = 'people'
function marcarAdmin() {
  if (form.value.admin) { papelAntes = form.value.papel; form.value.papel = 'aprovador' }
  else form.value.papel = papelAntes
}
async function criar() {
  const f = form.value
  erroForm.value = ''
  if (f.nome.trim().length < 2) { erroForm.value = 'Informe o nome completo.'; return }
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) { erroForm.value = 'Informe um e-mail válido.'; return }
  const r = await criando.run(() => usuarios.criar({ nome: f.nome.trim(), email: f.email.trim(), papel: f.papel, admin: f.admin }))
  if (!r.ok) { erroForm.value = criando.erro.value; return }
  copiado.value = ''
  senhaNova.value = { titulo: 'Usuário criado', nome: r.dados.usuario.nome, email: r.dados.usuario.email, senha: r.dados.senhaTemporaria }
  form.value = vazio()
  aberto.value = false
  await carregar()
}
</script>

<template>
  <PageHeader title="Usuários" description="Quem tem login neste sistema. Só administradores criam usuários e definem se cada pessoa é People ou Aprovador." />

  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted-foreground">{{ total }} usuários, {{ admins }} administrador{{ admins === 1 ? '' : 'es' }} ativo{{ admins === 1 ? '' : 's' }}.</p>
      <Dialog v-model:open="aberto">
        <DialogTrigger as-child><Button><UserPlus class="size-4" aria-hidden="true" /> Novo usuário</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>O sistema gera uma senha temporária, que aparece uma única vez. A pessoa será obrigada a trocá-la no primeiro acesso.</DialogDescription>
          </DialogHeader>
          <form class="space-y-4" novalidate @submit.prevent="criar">
            <div class="space-y-2"><Label for="n-nome">Nome completo</Label><Input id="n-nome" v-model="form.nome" autocomplete="off" /></div>
            <div class="space-y-2"><Label for="n-email">E-mail</Label><Input id="n-email" v-model="form.email" type="email" autocomplete="off" placeholder="nome@empresa.com" /></div>
            <div class="space-y-2">
              <Label for="n-papel">Perfil</Label>
              <Select v-model="form.papel" :disabled="form.admin">
                <SelectTrigger id="n-papel" class="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem v-for="(label, key) in roleLabels" :key="key" :value="key">{{ label }}</SelectItem></SelectContent>
              </Select>
            </div>
            <label class="flex cursor-pointer items-start gap-2 text-sm">
              <input v-model="form.admin" type="checkbox" class="mt-0.5 size-4 rounded border-input accent-[var(--primary)]" @change="marcarAdmin" />
              <span>Administrador<span class="block text-xs text-muted-foreground">Cria e gerencia usuários. O perfil passa a ser Aprovador.</span></span>
            </label>
            <p v-if="erroForm" class="flex gap-2 text-sm text-destructive" role="alert"><CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ erroForm }}</p>
            <Button type="submit" :disabled="criando.ocupado.value">{{ criando.ocupado.value ? 'Criando…' : 'Criar usuário' }}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <Card v-if="senhaNova" class="border-primary">
      <CardContent class="space-y-3">
        <p class="flex items-center gap-2 font-semibold"><KeyRound class="size-4" aria-hidden="true" /> {{ senhaNova.titulo }}: {{ senhaNova.nome }}</p>
        <p class="text-sm text-muted-foreground">{{ senhaNova.email }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <code class="rounded-lg bg-muted px-3 py-2 font-mono text-base tracking-wide select-all" data-testid="senha-temporaria">{{ senhaNova.senha }}</code>
          <Button size="sm" variant="outline" @click="copiar"><Copy class="size-4" aria-hidden="true" /> Copiar</Button>
        </div>
        <p v-if="copiado" class="text-sm text-muted-foreground" role="status">{{ copiado }}</p>
        <p class="text-sm">Esta senha <b>aparece só agora</b> e não fica guardada em lugar nenhum. Entregue à pessoa por um canal seguro, de preferência pessoalmente. No primeiro acesso ela será obrigada a escolher uma senha nova.</p>
        <Button size="sm" variant="ghost" @click="senhaNova = null">Já anotei, fechar</Button>
      </CardContent>
    </Card>

    <p v-if="erro" class="flex gap-2 text-sm text-destructive" role="alert"><CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ erro }}</p>
    <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>

    <Card v-else>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead class="text-center">Administrador</TableHead>
                <TableHead class="text-center">Situação</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="u in lista" :key="u.id" :class="u.ativo ? '' : 'text-muted-foreground'">
                <TableCell class="font-medium whitespace-normal">{{ u.nome }} <Badge v-if="souEu(u)" variant="outline" class="ml-1">você</Badge></TableCell>
                <TableCell>{{ u.email }}</TableCell>
                <TableCell>
                  <Select :model-value="u.papel" :disabled="souEu(u) || ocupado" @update:model-value="mudarPerfil(u, $event)">
                    <SelectTrigger class="w-36" :aria-label="`Perfil de ${u.nome}`"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem v-for="(label, key) in roleLabels" :key="key" :value="key">{{ label }}</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell class="text-center"><Badge v-if="u.admin" variant="default" class="gap-1"><ShieldCheck class="size-3" aria-hidden="true" /> Admin</Badge><span v-else class="text-muted-foreground">—</span></TableCell>
                <TableCell class="text-center"><Badge :variant="u.ativo ? 'secondary' : 'outline'">{{ u.ativo ? 'ativo' : 'desativado' }}</Badge></TableCell>
                <TableCell>{{ formatDate(u.criado_em) }}</TableCell>
                <TableCell class="whitespace-normal">
                  <span v-if="souEu(u)" class="text-sm text-muted-foreground">Esta é a sua conta</span>
                  <div v-else-if="emConfirmacao(u)" class="max-w-xs space-y-2">
                    <p class="text-sm">{{ textoConfirmacao[pendente.tipo] }}</p>
                    <div class="flex gap-2">
                      <Button size="sm" :disabled="ocupado" @click="confirmar(u)">Confirmar</Button>
                      <Button size="sm" variant="outline" @click="pendente = null">Cancelar</Button>
                    </div>
                  </div>
                  <div v-else class="flex flex-wrap gap-1">
                    <Button v-if="!u.ativo" size="sm" variant="outline" :disabled="ocupado" @click="ativar(u)">Ativar</Button>
                    <template v-else>
                      <Button size="sm" variant="outline" @click="pedir(u, u.admin ? 'admin_off' : 'admin_on')">{{ u.admin ? 'Remover admin' : 'Tornar admin' }}</Button>
                      <Button size="sm" variant="outline" @click="pedir(u, 'senha')">Redefinir senha</Button>
                      <Button size="sm" variant="ghost" @click="pedir(u, 'desativar')">Desativar</Button>
                    </template>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
