<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleAlert, LoaderCircle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/AuthLayout.vue'
import { useAction } from '@/composables/useAction'
import { useSessionStore } from '@/stores/session'

// Tela aberta pelo link do e-mail de recuperação: o Supabase entra com uma sessão temporária e aqui se define a senha nova.
const session = useSessionStore()
const router = useRouter()
const { erro, ocupado, run } = useAction()

const pronto = ref(false)
const nova = ref('')
const conf = ref('')

onMounted(async () => {
  await session.init()
  pronto.value = true
})

async function salvar() {
  erro.value = ''
  if (nova.value.length < 8) { erro.value = 'A senha precisa ter no mínimo 8 caracteres.'; return }
  if (nova.value !== conf.value) { erro.value = 'As duas senhas não são iguais.'; return }
  const r = await run(() => session.trocarSenha(nova.value))
  if (!r.ok) return
  await session.carregarPerfil()
  router.push(session.logado ? '/criacao' : '/entrar')
}
</script>

<template>
  <AuthLayout>
    <p v-if="!pronto" class="text-sm text-muted-foreground" role="status">Verificando o link…</p>

    <div v-else-if="!session.user" class="space-y-4">
      <h1 class="text-2xl font-semibold tracking-tight">Link inválido ou vencido</h1>
      <p class="text-sm text-muted-foreground">Este link de recuperação não funciona mais. Peça um novo na tela de entrada, em “Esqueci minha senha”.</p>
      <Button class="w-full" size="lg" @click="router.push('/entrar')">Ir para o login</Button>
    </div>

    <form v-else novalidate class="space-y-5" @submit.prevent="salvar">
      <div class="space-y-1.5">
        <h1 class="text-2xl font-semibold tracking-tight">Criar nova senha</h1>
        <p class="text-sm text-muted-foreground">Escolha uma senha nova para {{ session.user.email }}.</p>
      </div>
      <div class="space-y-2">
        <Label for="nova">Nova senha (mínimo de 8 caracteres)</Label>
        <Input id="nova" v-model="nova" type="password" autocomplete="new-password" />
      </div>
      <div class="space-y-2">
        <Label for="conf">Repita a nova senha</Label>
        <Input id="conf" v-model="conf" type="password" autocomplete="new-password" />
      </div>
      <div v-if="erro" class="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ erro }}</span>
      </div>
      <Button type="submit" class="w-full" size="lg" :disabled="ocupado">
        <LoaderCircle v-if="ocupado" class="size-4 animate-spin" aria-hidden="true" />
        {{ ocupado ? 'Salvando…' : 'Salvar nova senha' }}
      </Button>
    </form>
  </AuthLayout>
</template>
