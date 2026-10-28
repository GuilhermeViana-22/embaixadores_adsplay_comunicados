// Configuração do projeto.
export const appConfig = {
  name: 'Embaixadores Adsplay',
  // true SOMENTE quando o projeto for um dashboard/painel. Só então o botão de sair (logout) aparece.
  isDashboard: true,
  // Senha fictícia do perfil Aprovador, só para o protótipo. A senha real não fica no código.
  demoApproverPassword: 'exemplo123',
  // Horário sugerido na aprovação de um post
  defaultScheduleTime: '09:00',
}

// Rótulos dos perfis. Chaves usadas em userDb.js.
export const roleLabels = { admin: 'Aprovador', user: 'People' }
