// Posts de comunicados. status: pendente | devolvido | programado | publicado.
// Datas em texto local; os dois últimos posts usam datas relativas a agora.
import { createCollection } from './_base.js'
import { hoursFromNow } from '@/lib/dates.js'

const seed = [
  { id: 1, title: 'Boas-vindas aos novos colaboradores', text: 'Dê as boas-vindas à turma que entrou esta semana. Comente e reaja para apoiar quem está chegando.', artFileName: 'boas-vindas.png', plannedDate: '2026-10-05', channelId: 1, authorUserId: 2, status: 'publicado', returnReason: '', scheduledAt: '2026-10-05T10:00', publishedAt: '2026-10-05T10:00' },
  { id: 2, title: 'Campanha Outubro Rosa', text: 'Neste mês falamos sobre prevenção e cuidado. Conheça as ações da campanha e participe.', artFileName: 'outubro-rosa.png', plannedDate: '2026-10-09', channelId: 1, authorUserId: 3, status: 'publicado', returnReason: '', scheduledAt: '2026-10-09T15:00', publishedAt: '2026-10-09T15:00' },
  { id: 3, title: 'Novo benefício de saúde', text: 'A partir de outubro, o plano de saúde tem uma nova opção de cobertura. Veja os detalhes no link.', artFileName: 'beneficio-saude.png', plannedDate: '2026-09-28', channelId: 2, authorUserId: 4, status: 'publicado', returnReason: '', scheduledAt: '2026-09-28T09:00', publishedAt: '2026-09-28T09:00' },
  { id: 4, title: 'Orientações para envio de notas fiscais', text: 'Lembrete: as notas devem ser enviadas até o dia 25 de cada mês. Dúvidas, fale com o financeiro.', artFileName: 'notas-fiscais.png', plannedDate: '2026-10-22', channelId: 3, authorUserId: 2, status: 'publicado', returnReason: '', scheduledAt: '2026-10-22T11:00', publishedAt: '2026-10-22T11:00' },
  { id: 5, title: 'Pesquisa de clima aberta', text: 'A pesquisa de clima já está no ar. Leva menos de cinco minutos e a sua opinião ajuda muito.', artFileName: 'pesquisa-clima.png', plannedDate: '2026-10-26', channelId: 1, authorUserId: 5, status: 'publicado', returnReason: '', scheduledAt: hoursFromNow(-3), publishedAt: hoursFromNow(-3) },
  { id: 6, title: 'Confraternização de fim de ano', text: 'Salve a data! A confraternização será em dezembro. Em breve, mais detalhes.', artFileName: 'confraternizacao.png', plannedDate: '2026-11-03', channelId: 1, authorUserId: 2, status: 'pendente', returnReason: '', scheduledAt: '', publishedAt: '' },
  { id: 7, title: 'Recesso de fim de ano para PJ', text: 'Confira como funciona o período de recesso para quem atua como PJ.', artFileName: 'recesso-pj.png', plannedDate: '2026-11-10', channelId: 3, authorUserId: 3, status: 'devolvido', returnReason: 'Revisar a data do recesso e trocar a arte por uma em alta resolução.', scheduledAt: '', publishedAt: '' },
  { id: 8, title: 'Semana de treinamentos internos', text: 'Inscrições abertas para a semana de treinamentos. Escolha as trilhas que mais combinam com você.', artFileName: 'semana-treinamentos.png', plannedDate: '2026-10-28', channelId: 2, authorUserId: 4, status: 'programado', returnReason: '', scheduledAt: hoursFromNow(48), publishedAt: '' },
]

export const postDb = createCollection(seed)
