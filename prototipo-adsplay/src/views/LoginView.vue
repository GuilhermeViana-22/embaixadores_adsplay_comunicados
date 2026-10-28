<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { appConfig, roleLabels } from '@/config/app'
import { userDb } from '@/db'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()

const users = userDb.getAll().filter((u) => u.active)
const selectedId = ref('')
const password = ref('')
const error = ref('')

const selected = computed(() => users.find((u) => String(u.id) === selectedId.value) || null)
const needsPassword = computed(() => selected.value?.role === 'admin')

function enter() {
  error.value = ''
  if (!selected.value) {
    error.value = 'Escolha quem está entrando.'
    return
  }
  if (needsPassword.value && password.value !== appConfig.demoApproverPassword) {
    error.value = 'Senha incorreta.'
    return
  }
  session.login(selected.value.id)
  router.push('/criacao')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">{{ appConfig.name }}</CardTitle>
        <CardDescription>Login fictício do protótipo: escolha uma das pessoas de exemplo. Não há autenticação real.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="enter">
          <div class="space-y-2">
            <Label for="user">Entrar como</Label>
            <Select v-model="selectedId">
              <SelectTrigger id="user" class="w-full"><SelectValue placeholder="Escolha uma pessoa" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="u in users" :key="u.id" :value="String(u.id)">{{ u.name }} ({{ roleLabels[u.role] }})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="needsPassword" class="space-y-2">
            <Label for="password">Senha do perfil Aprovador</Label>
            <Input id="password" v-model="password" type="password" autocomplete="off" />
            <p class="text-xs text-muted-foreground">Senha de exemplo do protótipo: <Badge variant="secondary">{{ appConfig.demoApproverPassword }}</Badge></p>
          </div>
          <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
          <Button type="submit" class="w-full">Entrar</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
