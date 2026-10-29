import { tratar, gerarSenha } from './logic.js'
const ADMIN = '11111111-1111-4111-8111-111111111111', COMUM = '22222222-2222-4222-8222-222222222222', INATIVO = '33333333-3333-4333-8333-333333333333', ALVO = '44444444-4444-4444-8444-444444444444'
function fake(opts = {}) {
  const st = { users: [{ id: ADMIN, nome: 'Mel', email: 'mel@x.com', admin: true, ativo: true }, { id: COMUM, nome: 'Apr', email: 'apr@x.com', admin: false, ativo: true }, { id: INATIVO, nome: 'Ina', email: 'ina@x.com', admin: true, ativo: false }, { id: ALVO, nome: 'Alvo', email: 'alvo@x.com', admin: false, ativo: true }], criados: [], apagados: [], atualizados: [] }
  const tokens = { 't-admin': ADMIN, 't-comum': COMUM, 't-inativo': INATIVO }
  const consulta = (filtro) => ({ select: () => consulta(filtro), eq: (c, v) => consulta({ ...filtro, [c]: v }), maybeSingle: async () => ({ data: st.users.find((u) => Object.entries(filtro).every(([k, v]) => u[k] === v)) || null }) })
  return { st, admin: {
    auth: { getUser: async (t) => (tokens[t] ? { data: { user: { id: tokens[t] } }, error: null } : { data: null, error: { message: 'invalid' } }),
      admin: { createUser: async (a) => { if (opts.emailJaExiste) return { data: null, error: { code: 'email_exists', message: 'A user with this email address has already been registered' } }; if (opts.falhaCriar) return { data: null, error: { message: 'boom' } }; const id = '55555555-5555-4555-8555-555555555555'; st.criados.push({ id, ...a }); return { data: { user: { id } }, error: null } },
        deleteUser: async (id) => { st.apagados.push(id); return { error: null } },
        updateUserById: async (id, a) => { if (opts.falhaAtualizar) return { error: { message: 'x' } }; st.atualizados.push({ id, ...a }); return { error: null } } } },
    from: () => ({ ...consulta({}), insert: async (linha) => { if (opts.falhaPerfil) return { error: { message: 'rls' } }; st.users.push(linha); return { error: null } } }),
  } }
}
const req = (corpo, { token = 't-admin', metodo = 'POST', raw } = {}) => new Request('http://x/fn', { method: metodo, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: metodo === 'POST' ? (raw ?? JSON.stringify(corpo)) : undefined })
const rodar = async (corpo, o, f = fake(o?.fake)) => { const r = await tratar(req(corpo, o), f); return { status: r.status, corpo: r.status === 204 ? null : await r.json(), f } }
let falhas = 0; const ok = (nome, cond, extra = '') => { console.log((cond ? 'ok     ' : 'FALHOU ') + nome + (extra ? '  → ' + extra : '')); if (!cond) falhas++ }
const novo = { acao: 'criar', nome: 'Beatriz Souza', email: ' Beatriz@Empresa.com ', papel: 'people' }

let r = await tratar(new Request('http://x', { method: 'OPTIONS' }), fake()); ok('pré-voo CORS (OPTIONS) responde 204 com cabeçalhos', r.status === 204 && r.headers.get('access-control-allow-origin') === '*')
r = await tratar(new Request('http://x', { method: 'GET' }), fake()); ok('GET é recusado (405)', r.status === 405)
r = await rodar(novo, { token: null }); ok('sem token → 401', r.status === 401)
r = await rodar(novo, { token: 'invalido' }); ok('token inválido → 401', r.status === 401)
r = await rodar(novo, { token: 't-comum' }); ok('Aprovador comum (não admin) → 403', r.status === 403, r.corpo.erro)
r = await rodar(novo, { token: 't-inativo' }); ok('admin DESATIVADO → 403', r.status === 403)
r = await rodar(null, { raw: 'isto não é json' }); ok('corpo que não é JSON → 400', r.status === 400)
r = await rodar({ acao: 'apagar_tudo' }); ok('ação desconhecida → 400', r.status === 400)
r = await rodar({ ...novo, nome: 'A' }); ok('nome curto → 400', r.status === 400)
r = await rodar({ ...novo, email: 'sem-arroba' }); ok('e-mail inválido → 400', r.status === 400)
r = await rodar({ ...novo, papel: 'superuser' }); ok('perfil fora de People/Aprovador → 400', r.status === 400, r.corpo.erro)
r = await rodar({ ...novo, admin: true }); ok('admin com perfil People → 400', r.status === 400, r.corpo.erro)
r = await rodar({ ...novo, email: 'APR@x.com' }); ok('e-mail já cadastrado (sem diferenciar maiúsculas) → 409', r.status === 409)
r = await rodar(novo, { fake: { emailJaExiste: true } }); ok('login já existe no Supabase → 409', r.status === 409)
r = await rodar(novo, { fake: { falhaCriar: true } }); ok('falha ao criar login → 500 sem vazar detalhe', r.status === 500 && !JSON.stringify(r.corpo).includes('boom'))
r = await rodar(novo, { fake: { falhaPerfil: true } }); ok('falha ao gravar o perfil → 500 e o login é APAGADO (sem login órfão)', r.status === 500 && r.f.st.apagados.length === 1 && r.f.st.apagados[0] === '55555555-5555-4555-8555-555555555555')
r = await rodar(novo)
ok('criar usuário People → 201', r.status === 201, JSON.stringify(r.corpo.usuario))
const c = r.f.st.criados[0], senha = r.corpo.senhaTemporaria
ok('e-mail guardado limpo e em minúsculas', c.email === 'beatriz@empresa.com' && r.f.st.users.at(-1).email === 'beatriz@empresa.com')
ok('login criado já confirmado e marcado para trocar a senha', c.email_confirm === true && c.user_metadata.trocar_senha === true)
ok('a senha enviada ao Supabase é a mesma devolvida ao administrador', c.password === senha)
ok('perfil gravado sem admin e ativo', r.f.st.users.at(-1).admin === false && r.f.st.users.at(-1).ativo === true && r.f.st.users.at(-1).papel === 'people')
ok('a senha NUNCA é gravada na tabela de usuários', !JSON.stringify(r.f.st.users).includes(senha))
r = await rodar({ ...novo, email: 'adm@x.com', papel: 'aprovador', admin: true }); ok('criar Aprovador administrador → 201', r.status === 201 && r.corpo.usuario.admin === true && r.corpo.usuario.papel === 'aprovador')
const s = new Set(Array.from({ length: 300 }, gerarSenha)); const todas = [...s]
ok('300 senhas geradas, todas diferentes', s.size === 300)
ok('todas têm 12 caracteres, maiúscula, minúscula, número e símbolo, sem letras ambíguas', todas.every((x) => x.length === 12 && /[A-Z]/.test(x) && /[a-z]/.test(x) && /[0-9]/.test(x) && /[#$%&*+?@-]/.test(x) && !/[0OIl1]/.test(x)))
r = await rodar({ acao: 'redefinir_senha', id: ADMIN }); ok('redefinir a PRÓPRIA senha → 400', r.status === 400, r.corpo.erro)
r = await rodar({ acao: 'redefinir_senha', id: 'não-é-uuid' }); ok('id inválido → 400', r.status === 400)
r = await rodar({ acao: 'redefinir_senha', id: '99999999-9999-4999-8999-999999999999' }); ok('usuário que não existe → 404', r.status === 404)
r = await rodar({ acao: 'redefinir_senha', id: ALVO }, { token: 't-comum' }); ok('Aprovador comum não redefine senha → 403', r.status === 403)
r = await rodar({ acao: 'redefinir_senha', id: ALVO }, { fake: { falhaAtualizar: true } }); ok('falha ao atualizar → 500', r.status === 500)
r = await rodar({ acao: 'redefinir_senha', id: ALVO }); const a = r.f.st.atualizados[0]
ok('redefinir senha de outro usuário → 200 e marca para trocar', r.status === 200 && a.password === r.corpo.senhaTemporaria && a.user_metadata.trocar_senha === true && a.user_metadata.nome === 'Alvo')
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTodos os testes passaram')
process.exit(falhas ? 1 : 0)
