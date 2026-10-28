// Canais de divulgação do Slack (lista de hoje). Para incluir outro, adicione um item.
import { createCollection } from './_base.js'

const seed = [
  { id: 1, name: 'Comunicados gerais' },
  { id: 2, name: 'CLT' },
  { id: 3, name: 'PJ' },
]

export const canalDb = createCollection(seed)
