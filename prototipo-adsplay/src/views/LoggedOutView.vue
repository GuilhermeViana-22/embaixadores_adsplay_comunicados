<script setup>
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
    <h1 class="text-2xl font-semibold">Sessão encerrada</h1>
    <p class="text-sm text-muted-foreground">Login fictício: este protótipo não tem autenticação real.</p>
    <Button @click="router.push('/entrar')">Entrar novamente</Button>
  </div>
</template>
