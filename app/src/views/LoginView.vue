<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle, Lock, Mail } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/AuthLayout.vue'
import { useAction } from '@/composables/useAction'
import { configurado, MENSAGEM_SEM_CONFIG } from '@/lib/supabase'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const { erro, ocupado, run } = useAction()

const CHAVE_EMAIL = 'adsplay-ultimo-email'
const modo = ref('entrar') // entrar | recuperar
const email = ref('')
const senha = ref('')
const mostrar = ref(false)
const lembrar = ref(true)
const capsLigado = ref(false)
const erroEmail = ref('')
const erroSenha = ref('')
const aviso = ref('')
const campoEmail = ref(null)

// Só o e-mail é lembrado (nunca a senha), e só se a pessoa deixar marcado.
function lerEmailSalvo() { try { return localStorage.getItem(CHAVE_EMAIL) || '' } catch { return '' } }
function guardarEmail(valor) { try { valor ? localStorage.setItem(CHAVE_EMAIL, valor) : localStorage.removeItem(CHAVE_EMAIL) } catch { /* sem armazenamento: segue */ } }

onMounted(() => {
  email.value = lerEmailSalvo()
  campoEmail.value?.$el?.focus()
})

const emailValido = (v) => /^\S+@\S+\.\S+$/.test(v)
function validarEmail() {
  erroEmail.value = !email.value.trim() ? 'Digite o seu e-mail.' : !emailValido(email.value.trim()) ? 'Digite um e-mail válido, como nome@empresa.com.' : ''
  return !erroEmail.value
}
function verCaps(e) { capsLigado.value = Boolean(e.getModifierState && e.getModifierState('CapsLock')) }

async function entrar() {
  aviso.value = ''
  erro.value = ''
  const okEmail = validarEmail()
  erroSenha.value = senha.value ? '' : 'Digite a sua senha.'
  if (!okEmail || erroSenha.value) return
  const r = await run(() => session.entrar(email.value.trim(), senha.value))
  if (r.ok) {
    guardarEmail(lembrar.value ? email.value.trim() : '')
    senha.value = ''
    router.push('/criacao')
  }
}

async function recuperar() {
  aviso.value = ''
  erro.value = ''
  if (!validarEmail()) return
  const r = await run(() => session.recuperarSenha(email.value.trim()))
  if (r.ok) aviso.value = 'Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.'
}

async function trocarModo(novo) {
  modo.value = novo
  erro.value = ''
  aviso.value = ''
  erroEmail.value = ''
  erroSenha.value = ''
  await nextTick()
  campoEmail.value?.$el?.focus()
}
</script>

<template>
  <AuthLayout>
    <div v-if="!configurado" class="mb-6 flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
      <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{{ MENSAGEM_SEM_CONFIG }}</span>
    </div>

    <form novalidate class="space-y-5" @submit.prevent="modo === 'entrar' ? entrar() : recuperar()">
      <div class="space-y-1.5">
        <h1 class="text-2xl font-semibold tracking-tight">{{ modo === 'entrar' ? 'Entrar' : 'Recuperar a senha' }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ modo === 'entrar' ? 'Use o e-mail e a senha cadastrados.' : 'Digite o seu e-mail. Enviaremos um link para você criar uma nova senha.' }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="email">E-mail</Label>
        <div class="relative">
          <Mail class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="email" ref="campoEmail" v-model="email" type="email" class="pl-9" autocomplete="username" inputmode="email"
            placeholder="nome@empresa.com" :aria-invalid="Boolean(erroEmail)" :aria-describedby="erroEmail ? 'erro-email' : undefined" @blur="email && validarEmail()"
          />
        </div>
        <p v-if="erroEmail" id="erro-email" class="text-sm text-destructive">{{ erroEmail }}</p>
      </div>

      <div v-if="modo === 'entrar'" class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="senha">Senha</Label>
          <button type="button" class="rounded text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" @click="trocarModo('recuperar')">Esqueci minha senha</button>
        </div>
        <div class="relative">
          <Lock class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="senha" v-model="senha" :type="mostrar ? 'text' : 'password'" class="px-9" autocomplete="current-password"
            :aria-invalid="Boolean(erroSenha)" :aria-describedby="erroSenha ? 'erro-senha' : capsLigado ? 'aviso-caps' : undefined" @keydown="verCaps" @keyup="verCaps" @blur="capsLigado = false"
          />
          <button
            type="button" class="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :aria-label="mostrar ? 'Ocultar a senha' : 'Mostrar a senha'" :aria-pressed="mostrar" @click="mostrar = !mostrar"
          >
            <EyeOff v-if="mostrar" class="size-4" aria-hidden="true" />
            <Eye v-else class="size-4" aria-hidden="true" />
          </button>
        </div>
        <p v-if="erroSenha" id="erro-senha" class="text-sm text-destructive">{{ erroSenha }}</p>
        <p v-else-if="capsLigado" id="aviso-caps" class="text-sm text-muted-foreground" role="status">A tecla Caps Lock está ligada.</p>
      </div>

      <label v-if="modo === 'entrar'" class="flex cursor-pointer items-center gap-2 text-sm">
        <input v-model="lembrar" type="checkbox" class="size-4 rounded border-input accent-[var(--primary)]" />
        Lembrar o meu e-mail neste computador
      </label>

      <div v-if="erro" class="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ erro }}</span>
      </div>
      <div v-if="aviso" class="flex gap-2 rounded-lg border bg-muted/50 p-3 text-sm" role="status">
        <CircleCheck class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{{ aviso }}</span>
      </div>

      <Button type="submit" class="w-full" size="lg" :disabled="ocupado || !configurado">
        <LoaderCircle v-if="ocupado" class="size-4 animate-spin" aria-hidden="true" />
        {{ modo === 'entrar' ? (ocupado ? 'Entrando…' : 'Entrar') : ocupado ? 'Enviando…' : 'Enviar link' }}
      </Button>

      <button v-if="modo === 'recuperar'" type="button" class="mx-auto flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" @click="trocarModo('entrar')">
        <ArrowLeft class="size-4" aria-hidden="true" /> Voltar para o login
      </button>
    </form>
  </AuthLayout>
</template>
