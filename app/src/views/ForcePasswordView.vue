<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleAlert, LoaderCircle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/AuthLayout.vue'
import { useAction } from '@/composables/useAction'
import { useSessionStore } from '@/stores/session'

// Primeiro acesso com a senha temporária: a pessoa precisa escolher uma senha só dela.
const session = useSessionStore()
const router = useRouter()
const { erro, ocupado, run } = useAction()
const nova = ref('')
const conf = ref('')

async function salvar() {
  erro.value = ''
  if (nova.value.length < 8) { erro.value = 'A senha precisa ter no mínimo 8 caracteres.'; return }
  if (nova.value !== conf.value) { erro.value = 'As duas senhas não são iguais.'; return }
  const r = await run(() => session.trocarSenha(nova.value))
  if (r.ok) router.push('/criacao')
}
async function sair() { await router.push('/saiu'); await session.sair() }
</script>

<template>
  <AuthLayout>
    <form novalidate class="space-y-5" @submit.prevent="salvar">
      <div class="space-y-1.5">
        <h1 class="text-2xl font-semibold tracking-tight">Escolha a sua senha</h1>
        <p class="text-sm text-muted-foreground">Você entrou com uma senha temporária. Para continuar, crie uma senha só sua.</p>
      </div>
      <div class="space-y-2"><Label for="nova">Nova senha (mínimo de 8 caracteres)</Label><Input id="nova" v-model="nova" type="password" autocomplete="new-password" /></div>
      <div class="space-y-2"><Label for="conf">Repita a nova senha</Label><Input id="conf" v-model="conf" type="password" autocomplete="new-password" /></div>
      <div v-if="erro" class="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{{ erro }}</span>
      </div>
      <Button type="submit" class="w-full" size="lg" :disabled="ocupado">
        <LoaderCircle v-if="ocupado" class="size-4 animate-spin" aria-hidden="true" />{{ ocupado ? 'Salvando…' : 'Salvar e entrar' }}
      </Button>
      <button type="button" class="mx-auto block rounded text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" @click="sair">Sair</button>
    </form>
  </AuthLayout>
</template>
