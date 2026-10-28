// Posts externos (Instagram e LinkedIn). Cada um vale 50 pontos no mês da data.
import { createCollection } from './_base.js'

const seed = [
  { id: 1, network: 'Instagram', name: 'Bastidores do evento de integração', date: '2026-09-18', printFileName: 'print-integracao.png', colaboradorId: 1 },
  { id: 2, network: 'LinkedIn', name: 'Vaga aberta para analista de dados', date: '2026-10-02', printFileName: 'print-vaga-dados.png', colaboradorId: 3 },
  { id: 3, network: 'Instagram', name: 'Dia do Cliente', date: '2026-10-15', printFileName: 'print-dia-cliente.png', colaboradorId: 3 },
  { id: 4, network: 'LinkedIn', name: 'Retrospectiva do trimestre', date: '2026-10-20', printFileName: 'print-retrospectiva.png', colaboradorId: 6 },
  { id: 5, network: 'Instagram', name: 'Equipe no workshop de inovação', date: '2026-09-25', printFileName: 'print-workshop.png', colaboradorId: 7 },
]

export const postExternoDb = createCollection(seed)
