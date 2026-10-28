// Catálogo fictício de permissões. Cada usuário guarda a lista de chaves (key) que possui.
import { createCollection } from './_base.js'

const seed = [
  { id: 1, key: 'view', label: 'Visualizar' },
  { id: 2, key: 'create_post', label: 'Criar posts' },
  { id: 3, key: 'approve_post', label: 'Aprovar e programar posts' },
  { id: 4, key: 'register_interaction', label: 'Lançar comentários e reações' },
  { id: 5, key: 'register_external', label: 'Registrar posts externos' },
  { id: 6, key: 'register_action', label: 'Registrar ações de people' },
  { id: 7, key: 'manage_roster', label: 'Cadastrar colaboradores ativos' },
  { id: 8, key: 'manage_users', label: 'Gerenciar usuários' },
]

export const permissionDb = createCollection(seed)
