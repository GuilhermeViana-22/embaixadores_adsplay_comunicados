// Configuração do projeto.
export const appConfig = {
  name: 'Embaixadores Adsplay',
  // true SOMENTE quando o projeto for um dashboard/painel. Só então o botão de sair (logout) aparece.
  isDashboard: true,
  // Horário sugerido na aprovação de um post
  defaultScheduleTime: '09:00',
}

// Rótulos dos papéis, como estão na tabela users do Supabase.
export const roleLabels = { aprovador: 'Aprovador', people: 'People' }

// O que cada papel pode fazer. As regras de verdade ficam no banco (RLS); isto só mostra ou esconde botões.
export const permissionLabels = {
  view: 'Visualizar',
  create_post: 'Criar posts',
  approve_post: 'Aprovar, devolver, programar e cancelar posts',
  register_interaction: 'Lançar comentários e reações',
  register_external: 'Registrar posts externos',
  register_action: 'Registrar ações de people',
  manage_roster: 'Cadastrar colaboradores ativos',
  manage_settings: 'Alterar canais, pontos e usuários',
}
const people = ['view', 'create_post', 'register_interaction', 'register_external', 'register_action']
export const permissionsByRole = {
  people,
  aprovador: [...people, 'approve_post', 'manage_roster', 'manage_settings'],
}
