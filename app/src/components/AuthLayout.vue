<script setup>
import { CalendarClock, ShieldCheck, Trophy } from '@lucide/vue'
import { appConfig } from '@/config/app'

// Moldura das telas de entrada: painel da marca (só em telas grandes) e área do formulário.
const destaques = [
  { icone: CalendarClock, titulo: 'Comunicados com aprovação', texto: 'Crie, aprove e programe cada post com data e horário.' },
  { icone: Trophy, titulo: 'Rankings do mês e final', texto: 'Comentários, reações, posts externos e ações de people viram pontos.' },
  { icone: ShieldCheck, titulo: 'Acesso por perfil', texto: 'Cada pessoa vê e faz só o que o seu perfil permite.' },
]
</script>

<template>
  <div class="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <aside
      class="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex"
      style="background: linear-gradient(145deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 60%, var(--background)) 100%)"
    >
      <div class="absolute -top-24 -right-24 size-80 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
      <div class="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <p class="relative text-lg font-semibold tracking-tight">{{ appConfig.name }}</p>
      <div class="relative space-y-8">
        <h2 class="max-w-sm text-3xl leading-tight font-semibold tracking-tight">Comunicados e pontuação em um só lugar.</h2>
        <ul class="space-y-5">
          <li v-for="d in destaques" :key="d.titulo" class="flex max-w-sm gap-3">
            <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/25"><component :is="d.icone" class="size-5" aria-hidden="true" /></span>
            <span><span class="block font-medium">{{ d.titulo }}</span><span class="block text-sm opacity-80">{{ d.texto }}</span></span>
          </li>
        </ul>
      </div>
      <p class="relative text-xs opacity-70">Uso interno.</p>
    </aside>

    <main class="flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        <p class="mb-8 text-lg font-semibold tracking-tight lg:hidden">{{ appConfig.name }}</p>
        <slot />
      </div>
    </main>
  </div>
</template>
