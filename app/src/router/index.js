import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import CreatePostView from '@/views/CreatePostView.vue'
import ScheduledPostsView from '@/views/ScheduledPostsView.vue'
import PublishedPostsView from '@/views/PublishedPostsView.vue'
import ExternalPostsView from '@/views/ExternalPostsView.vue'
import PeopleActionsView from '@/views/PeopleActionsView.vue'
import MonthlyRankingView from '@/views/MonthlyRankingView.vue'
import FinalRankingView from '@/views/FinalRankingView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import LoggedOutView from '@/views/LoggedOutView.vue'

// Uma rota por tela. Novas telas entram aqui e em layouts/AppLayout.vue.
// A rota /configuracoes é OBRIGATÓRIA em todo projeto (regra 07).
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/criacao' },
    { path: '/criacao', name: 'create-post', component: CreatePostView, meta: { title: 'Criação de posts' } },
    { path: '/programados', name: 'scheduled', component: ScheduledPostsView, meta: { title: 'Posts programados' } },
    { path: '/publicados', name: 'published', component: PublishedPostsView, meta: { title: 'Posts publicados' } },
    { path: '/externos', name: 'external', component: ExternalPostsView, meta: { title: 'Post Externo' } },
    { path: '/acoes', name: 'actions', component: PeopleActionsView, meta: { title: 'Ações de people' } },
    { path: '/ranking-mes', name: 'monthly-ranking', component: MonthlyRankingView, meta: { title: 'Ranking do mês' } },
    { path: '/ranking-final', name: 'final-ranking', component: FinalRankingView, meta: { title: 'Ranking final' } },
    { path: '/configuracoes', name: 'settings', component: SettingsView, meta: { title: 'Configurações' } },
    { path: '/entrar', name: 'login', component: LoginView, meta: { title: 'Entrar', bare: true } },
    { path: '/redefinir-senha', name: 'reset-password', component: ResetPasswordView, meta: { title: 'Nova senha', bare: true } },
    { path: '/saiu', name: 'logged-out', component: LoggedOutView, meta: { title: 'Sessão encerrada', bare: true } },
  ],
})

// Sem login (e perfil ativo no sistema), volta para a tela de entrada.
router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.init()
  if (!session.logado && !['login', 'logged-out', 'reset-password'].includes(to.name)) return { name: 'login' }
  if (session.logado && to.name === 'login') return { path: '/criacao' }
})

export default router
