<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { appConfig } from '@/config/app'
import { useAction } from '@/composables/useAction'
import { configurado, MENSAGEM_SEM_CONFIG } from '@/lib/supabase'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const { erro, ocupado, run } = useAction()

const email = ref('')
const senha = ref('')
const mostrar = ref(false)

async function entrar() {
  if (!email.value.trim() || !senha.value) { erro.value = 'Preencha o e-mail e a senha.'; return }
  const r = await run(() => session.entrar(email.value.trim(), senha.value))
  if (r.ok) { senha.value = ''; router.push('/criacao') }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">{{ appConfig.name }}</CardTitle>
        <CardDescription>Entre com o e-mail e a senha cadastrados.</CardDescription>
      </CardHeader>
      <CardContent>
        <p v-if="!configurado" class="mb-4 rounded-lg border border-destructive p-3 text-sm text-destructive" role="alert">{{ MENSAGEM_SEM_CONFIG }}</p>
        <form class="space-y-4" novalidate @submit.prevent="entrar">
          <div class="space-y-2">
            <Label for="email">E-mail</Label>
            <Input id="email" v-model="email" type="email" autocomplete="username" inputmode="email" />
          </div>
          <div class="space-y-2">
            <Label for="senha">Senha</Label>
            <div class="flex gap-2">
              <Input id="senha" v-model="senha" :type="mostrar ? 'text' : 'password'" autocomplete="current-password" />
              <Button type="button" variant="outline" :aria-pressed="mostrar" @click="mostrar = !mostrar">{{ mostrar ? 'Ocultar' : 'Mostrar' }}</Button>
            </div>
          </div>
          <p v-if="erro" class="text-sm text-destructive" role="alert">{{ erro }}</p>
          <Button type="submit" class="w-full" :disabled="ocupado || !configurado">{{ ocupado ? 'Entrando…' : 'Entrar' }}</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
