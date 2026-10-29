// Lógica da função "admin-usuarios": cria usuários e redefine senhas. Só administradores ativos podem usar.
// Roda no servidor do Supabase, onde a chave secreta (service_role) existe; ela nunca vai para o navegador.

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

const json = (status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'content-type': 'application/json' } })
const erro = (status, mensagem) => json(status, { erro: mensagem })

const PAPEIS = ['people', 'aprovador']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Senha temporária de 12 caracteres, sem letras ambíguas (0/O, 1/l/I), com maiúscula, minúscula, número e símbolo.
export function gerarSenha() {
  const classes = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '#$%&*+-?@']
  const todos = classes.join('')
  const sorteio = (n) => { // sorteio sem viés
    const limite = 256 - (256 % n)
    for (;;) { const b = crypto.getRandomValues(new Uint8Array(1))[0]; if (b < limite) return b % n }
  }
  const senha = classes.map((c) => c[sorteio(c.length)])
  while (senha.length < 12) senha.push(todos[sorteio(todos.length)])
  for (let i = senha.length - 1; i > 0; i--) { const j = sorteio(i + 1); [senha[i], senha[j]] = [senha[j], senha[i]] } // embaralha
  return senha.join('')
}

export async function tratar(req, { admin }) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return erro(405, 'Método não permitido.')

  // 1) Quem está pedindo? O token é conferido no servidor de login do Supabase.
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return erro(401, 'Faça login para continuar.')
  const { data: sessao, error: erroSessao } = await admin.auth.getUser(token)
  if (erroSessao || !sessao || !sessao.user) return erro(401, 'Sessão inválida ou expirada. Entre de novo.')
  const eu = sessao.user

  // 2) É administrador ativo?
  const { data: perfil } = await admin.from('users').select('id, admin, ativo').eq('id', eu.id).maybeSingle()
  if (!perfil || !perfil.ativo || !perfil.admin) return erro(403, 'Só administradores podem gerenciar usuários.')

  let corpo
  try { corpo = await req.json() } catch { return erro(400, 'Pedido inválido.') }

  if (corpo.acao === 'criar') return criar(corpo, admin)
  if (corpo.acao === 'redefinir_senha') return redefinir(corpo, admin, eu.id)
  return erro(400, 'Ação desconhecida.')
}

async function criar(c, admin) {
  const nome = typeof c.nome === 'string' ? c.nome.trim() : ''
  const email = typeof c.email === 'string' ? c.email.trim().toLowerCase() : ''
  if (nome.length < 2 || nome.length > 120) return erro(400, 'Informe o nome completo.')
  if (!EMAIL.test(email) || email.length > 200) return erro(400, 'Informe um e-mail válido.')
  if (!PAPEIS.includes(c.papel)) return erro(400, 'O perfil precisa ser People ou Aprovador.')
  const ehAdmin = c.admin === true
  if (ehAdmin && c.papel !== 'aprovador') return erro(400, 'Um administrador precisa ter o perfil Aprovador.')

  const { data: existente } = await admin.from('users').select('id').eq('email', email).maybeSingle()
  if (existente) return erro(409, 'Já existe um usuário com este e-mail.')

  const senha = gerarSenha()
  const { data: criado, error: erroCriar } = await admin.auth.admin.createUser({
    email, password: senha, email_confirm: true, user_metadata: { nome, trocar_senha: true },
  })
  if (erroCriar || !criado || !criado.user) {
    const jaExiste = erroCriar && (erroCriar.code === 'email_exists' || /already|registered/i.test(erroCriar.message || ''))
    return jaExiste ? erro(409, 'Já existe um login com este e-mail.') : erro(500, 'Não foi possível criar o login.')
  }

  const usuario = { id: criado.user.id, nome, email, papel: c.papel, admin: ehAdmin, ativo: true }
  const { error: erroPerfil } = await admin.from('users').insert(usuario)
  if (erroPerfil) {
    await admin.auth.admin.deleteUser(criado.user.id) // não deixa um login sem perfil
    return erro(500, 'Não foi possível cadastrar o perfil. O login não foi criado.')
  }
  return json(201, { usuario, senhaTemporaria: senha })
}

async function redefinir(c, admin, meuId) {
  if (typeof c.id !== 'string' || !UUID.test(c.id)) return erro(400, 'Usuário inválido.')
  if (c.id === meuId) return erro(400, 'Para trocar a sua própria senha, use Configurações.')
  const { data: alvo } = await admin.from('users').select('id, nome').eq('id', c.id).maybeSingle()
  if (!alvo) return erro(404, 'Usuário não encontrado.')
  const senha = gerarSenha()
  const { error } = await admin.auth.admin.updateUserById(c.id, { password: senha, user_metadata: { nome: alvo.nome, trocar_senha: true } })
  if (error) return erro(500, 'Não foi possível redefinir a senha.')
  return json(200, { id: c.id, senhaTemporaria: senha })
}
