<script setup>
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { permissionDb, userDb } from '@/db'
import { roleLabels } from '@/config/app'
import { useSessionStore } from '@/stores/session'
import { colorPresets, useThemeStore } from '@/stores/theme'

const session = useSessionStore()
const theme = useThemeStore()

const users = ref(userDb.getAll())
const catalog = permissionDb.getAll()
const labelOf = (key) => catalog.find((p) => p.key === key)?.label ?? key

// Aprovador vê e edita todos; People vê só o próprio perfil, sem editar permissões.
const visibleUsers = computed(() => (session.isAdmin ? users.value : users.value.filter((u) => u.id === session.userId)))

function reload() {
  users.value = userDb.getAll()
  session.refresh()
}

// Perfil
const profile = ref({ name: session.user.name, email: session.user.email })
const saved = ref(false)
function saveProfile() {
  userDb.update(session.userId, { ...profile.value })
  reload()
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
function setRole(id, role) {
  userDb.update(id, { role })
  reload()
}
function switchUser(id) {
  session.login(Number(id))
  profile.value = { name: session.user.name, email: session.user.email }
}

// Permissões
const missing = (user) => catalog.filter((p) => !user.permissions.includes(p.key))
function addPermission(user, key) {
  userDb.update(user.id, { permissions: [...user.permissions, key] })
  reload()
}
function removePermission(user, key) {
  userDb.update(user.id, { permissions: user.permissions.filter((k) => k !== key) })
  reload()
}

// Aparência
const modes = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Configurações</h1>

    <Tabs default-value="profile">
      <TabsList>
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="permissions">Permissões</TabsTrigger>
        <TabsTrigger value="appearance">Aparência</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" class="mt-4 space-y-4">
        <Card class="max-w-xl">
          <CardHeader>
            <CardTitle>Seu perfil</CardTitle>
            <CardDescription>Perfil atual: {{ roleLabels[session.user.role] }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <form class="space-y-4" @submit.prevent="saveProfile">
              <div class="space-y-2">
                <Label for="name">Nome</Label>
                <Input id="name" v-model="profile.name" />
              </div>
              <div class="space-y-2">
                <Label for="email">E-mail</Label>
                <Input id="email" v-model="profile.email" type="email" />
              </div>
              <div class="space-y-2">
                <Label>Tipo de perfil</Label>
                <Select :model-value="session.user.role" :disabled="!session.isAdmin" @update:model-value="setRole(session.userId, $event)">
                  <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="(label, key) in roleLabels" :key="key" :value="key">{{ label }}</SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="!session.isAdmin" class="text-xs text-muted-foreground">Só o Aprovador altera o tipo de perfil.</p>
              </div>
              <div class="flex items-center gap-3">
                <Button type="submit">Salvar</Button>
                <span v-if="saved" class="text-sm text-muted-foreground">Salvo.</span>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card class="max-w-xl">
          <CardHeader>
            <CardTitle>Simular outro usuário</CardTitle>
            <CardDescription>Só existe no protótipo, para testar o que cada perfil enxerga.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select :model-value="String(session.userId)" @update:model-value="switchUser">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="u in users" :key="u.id" :value="String(u.id)">{{ u.name }} ({{ roleLabels[u.role] }})</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="permissions" class="mt-4 space-y-4">
        <p v-if="!session.isAdmin" class="text-sm text-muted-foreground">Você vê só as suas permissões. Para alterar, peça ao Aprovador.</p>
        <Card v-for="u in visibleUsers" :key="u.id" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{{ u.name }}</CardTitle>
            <CardDescription>{{ u.email }} · {{ roleLabels[u.role] }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex flex-wrap gap-2">
              <Badge v-for="key in u.permissions" :key="key" variant="secondary" class="gap-1">
                {{ labelOf(key) }}
                <button v-if="session.isAdmin" type="button" class="ml-1 rounded-sm hover:text-destructive" :aria-label="`Remover permissão ${labelOf(key)}`" @click="removePermission(u, key)">×</button>
              </Badge>
              <span v-if="!u.permissions.length" class="text-sm text-muted-foreground">Nenhuma permissão.</span>
            </div>
            <Select v-if="session.isAdmin && missing(u).length" model-value="" @update:model-value="addPermission(u, $event)">
              <SelectTrigger class="w-64"><SelectValue placeholder="Adicionar permissão" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in missing(u)" :key="p.key" :value="p.key">{{ p.label }}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance" class="mt-4">
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
                  v-for="c in colorPresets"
                  :key="c.value"
                  type="button"
                  :aria-label="`Cor ${c.name}`"
                  class="size-8 rounded-full border-2"
                  :class="theme.primary === c.value ? 'border-foreground' : 'border-transparent'"
                  :style="{ backgroundColor: c.value }"
                  @click="theme.setPrimary(c.value)"
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
