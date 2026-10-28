// Ações de people, só para o ranking final.
// type: 'treinamento' | 'destaque' | 'social'. participantIds são ids de colaboradorDb.
import { createCollection } from './_base.js'

const seed = [
  { id: 1, type: 'treinamento', name: 'Segurança da informação', date: '2026-09-22', fileName: 'presenca-seguranca.xlsx', participantIds: [1, 2, 3, 4, 5, 6, 7, 8], registeredByUserId: 2 },
  { id: 2, type: 'treinamento', name: 'Atendimento ao cliente', date: '2026-10-14', fileName: 'presenca-atendimento.xlsx', participantIds: [2, 3, 9, 10], registeredByUserId: 3 },
  { id: 3, type: 'destaque', name: 'Q3 2026', date: '', fileName: 'destaques-q3.xlsx', participantIds: [3, 7], registeredByUserId: 2 },
  { id: 4, type: 'social', name: 'Q3 2026', date: '', fileName: 'acao-social-q3.xlsx', participantIds: [1, 4, 5, 9, 10], registeredByUserId: 5 },
]

export const acaoPeopleDb = createCollection(seed)
