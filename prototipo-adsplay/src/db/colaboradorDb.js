// Colaboradores usados nos rankings e nas listas suspensas. Nomes inventados.
// Só colaboradores ativos pontuam.
import { createCollection } from './_base.js'

const seed = [
  { id: 1, name: 'Ana Beatriz Sampaio', email: 'ana.sampaio@exemplo.com', active: true },
  { id: 2, name: 'Bruno Carvalho Lima', email: 'bruno.lima@exemplo.com', active: true },
  { id: 3, name: 'Carolina Mendes Rocha', email: 'carolina.rocha@exemplo.com', active: true },
  { id: 4, name: 'Daniel Ferreira Alves', email: 'daniel.alves@exemplo.com', active: true },
  { id: 5, name: 'Eduarda Pires Souza', email: 'eduarda.souza@exemplo.com', active: true },
  { id: 6, name: 'Felipe Andrade Costa', email: 'felipe.costa@exemplo.com', active: true },
  { id: 7, name: 'Gabriela Nogueira Reis', email: 'gabriela.reis@exemplo.com', active: true },
  { id: 8, name: 'Henrique Barros Dias', email: 'henrique.dias@exemplo.com', active: true },
  { id: 9, name: 'Isabela Teixeira Melo', email: 'isabela.melo@exemplo.com', active: true },
  { id: 10, name: 'João Pedro Cardoso', email: 'joao.cardoso@exemplo.com', active: true },
  { id: 11, name: 'Larissa Monteiro Pinto', email: 'larissa.pinto@exemplo.com', active: false },
  { id: 12, name: 'Marcelo Ribeiro Santos', email: 'marcelo.santos@exemplo.com', active: false },
]

export const colaboradorDb = createCollection(seed)
