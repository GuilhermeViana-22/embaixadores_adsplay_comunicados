<script setup>
import { useRouter } from 'vue-router'
import { CalendarClock, FilePlus2, Share2, Send, Settings, Sparkles, Trophy, Crown } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { appConfig, roleLabels } from '@/config/app'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()

// Itens do menu lateral. Novas telas entram aqui e em src/router/index.js.
// "Configurações" é obrigatório em todo projeto.
const menu = [
  { to: '/criacao', label: 'Criação de posts', icon: FilePlus2 },
  { to: '/programados', label: 'Posts programados', icon: CalendarClock },
  { to: '/publicados', label: 'Posts publicados', icon: Send },
  { to: '/externos', label: 'Post Externo', icon: Share2 },
  { to: '/acoes', label: 'Ações de people', icon: Sparkles },
  { to: '/ranking-mes', label: 'Ranking do mês', icon: Trophy },
  { to: '/ranking-final', label: 'Ranking final', icon: Crown },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

// Troca de tela primeiro e só depois apaga a sessão, para a tela atual não ler um usuário vazio.
async function logout() {
  await router.push('/saiu')
  session.logout()
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
    <aside class="shrink-0 border-b bg-sidebar p-4 md:w-64 md:border-r md:border-b-0">
      <p class="mb-4 text-lg font-semibold tracking-tight md:mb-6">{{ appConfig.name }}</p>
      <nav class="flex gap-1 overflow-x-auto md:flex-col" aria-label="Menu principal">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap hover:bg-sidebar-accent"
          active-class="bg-sidebar-accent font-medium text-sidebar-accent-foreground"
        >
          <component :is="item.icon" class="size-4" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex flex-wrap items-center justify-end gap-3 border-b p-4">
        <Badge v-if="session.user" variant="secondary">{{ roleLabels[session.user.role] }}</Badge>
        <span class="text-sm text-muted-foreground">{{ session.user?.name }}</span>
        <Avatar>
          <AvatarFallback>{{ session.user?.name.slice(0, 2).toUpperCase() }}</AvatarFallback>
        </Avatar>
        <!-- Logout só aparece em dashboards (appConfig.isDashboard) -->
        <Button v-if="appConfig.isDashboard" variant="outline" size="sm" @click="logout">Sair</Button>
      </header>
      <main class="flex-1 p-4 md:p-8"><slot /></main>
    </div>
  </div>
</template>
