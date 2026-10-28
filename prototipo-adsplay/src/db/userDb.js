// Model fictício: as 6 pessoas que usam o sistema. Todos os dados são inventados.
// role: 'admin' = Aprovador, 'user' = People (rótulos em config/app.js).
import { createCollection } from './_base.js'

const peoplePermissions = ['view', 'create_post', 'register_interaction', 'register_external', 'register_action']

const seed = [
  { id: 1, name: 'Helena Duarte', email: 'helena.duarte@exemplo.com', role: 'admin', active: true, permissions: [...peoplePermissions, 'approve_post', 'manage_roster', 'manage_users'] },
  { id: 2, name: 'Rafael Moura', email: 'rafael.moura@exemplo.com', role: 'user', active: true, permissions: [...peoplePermissions] },
  { id: 3, name: 'Camila Torres', email: 'camila.torres@exemplo.com', role: 'user', active: true, permissions: [...peoplePermissions] },
  { id: 4, name: 'Diego Farias', email: 'diego.farias@exemplo.com', role: 'user', active: true, permissions: [...peoplePermissions] },
  { id: 5, name: 'Patrícia Lemos', email: 'patricia.lemos@exemplo.com', role: 'user', active: true, permissions: [...peoplePermissions] },
  { id: 6, name: 'Tiago Nunes', email: 'tiago.nunes@exemplo.com', role: 'user', active: true, permissions: ['view', 'create_post'] },
]

export const userDb = createCollection(seed)

// Quem aparece "logado" no início; a sessão do mockup fica em stores/session.js.
export const DEFAULT_USER_ID = 2
export const currentUser = () => userDb.getById(DEFAULT_USER_ID)
