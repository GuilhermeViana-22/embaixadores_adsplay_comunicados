<script setup>
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5 text-center text-foreground">
    <h1 class="text-2xl font-semibold">Sessão encerrada</h1>
    <p class="text-sm text-muted-foreground">Você saiu com segurança. Entre novamente quando quiser.</p>
    <Button @click="router.push('/login')">Entrar novamente</Button>
  </div>
</template>
