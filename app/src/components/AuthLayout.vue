<script setup>
import { CalendarClock, ShieldCheck, Trophy } from '@lucide/vue'
import { appConfig } from '@/config/app'

// Moldura das telas de entrada: fundo em gradiente roxo, painel da marca (só em telas grandes)
// e um cartão com o formulário. Só há login: contas são criadas pelo Aprovador.
const destaques = [
  { icone: CalendarClock, titulo: 'Comunicados com aprovação', texto: 'Crie, aprove e programe cada post com data e horário.' },
  { icone: Trophy, titulo: 'Rankings do mês e final', texto: 'Comentários, reações, posts externos e ações de people viram pontos.' },
  { icone: ShieldCheck, titulo: 'Acesso por perfil', texto: 'Cada pessoa vê e faz só o que o seu perfil permite.' },
]
</script>

<template>
  <div
    class="relative isolate min-h-dvh overflow-hidden text-white"
    style="background: radial-gradient(120% 90% at 0% 0%, #7c3aed 0%, transparent 55%), radial-gradient(100% 80% at 100% 100%, #c026d3 0%, transparent 55%), linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #5b21b6 100%)"
  >
    <div class="pointer-events-none absolute -top-32 -left-24 -z-10 size-96 rounded-full bg-violet-400/30 blur-3xl" aria-hidden="true" />
    <div class="pointer-events-none absolute -right-24 -bottom-40 -z-10 size-[28rem] rounded-full bg-fuchsia-500/25 blur-3xl" aria-hidden="true" />
    <div class="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 22px 22px" aria-hidden="true" />

    <div class="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12">
      <section class="hidden lg:block">
        <p class="text-lg font-semibold tracking-tight">{{ appConfig.name }}</p>
        <h2 class="mt-10 max-w-md text-4xl leading-tight font-semibold tracking-tight">Comunicados e pontuação em um só lugar.</h2>
        <ul class="mt-10 space-y-6">
          <li v-for="d in destaques" :key="d.titulo" class="flex max-w-md gap-4">
            <span class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur"><component :is="d.icone" class="size-5" aria-hidden="true" /></span>
            <span><span class="block font-medium">{{ d.titulo }}</span><span class="block text-sm text-white/75">{{ d.texto }}</span></span>
          </li>
        </ul>
        <p class="mt-14 text-xs text-white/60">Uso interno.</p>
      </section>

      <main class="mx-auto w-full max-w-md">
        <p class="mb-6 text-center text-lg font-semibold tracking-tight lg:hidden">{{ appConfig.name }}</p>
        <div class="rounded-3xl bg-background/95 p-6 text-foreground shadow-2xl ring-1 ring-white/30 backdrop-blur-xl sm:p-9">
          <slot />
        </div>
        <p class="mt-6 text-center text-xs text-white/60 lg:hidden">Uso interno.</p>
      </main>
    </div>
  </div>
</template>
