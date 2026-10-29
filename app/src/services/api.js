// Todas as chamadas ao Supabase passam por aqui: uma função por operação, uma seção por tabela.
// As telas não conhecem o Supabase; só chamam estas funções.
import { MENSAGEM_SEM_CONFIG, supabase } from '@/lib/supabase'
import { friendly } from '@/lib/errors'

function cliente() {
  if (!supabase) throw new Error(MENSAGEM_SEM_CONFIG)
  return supabase
}

// Espera uma consulta e devolve os dados; se der erro, lança uma mensagem em português.
async function ok(consulta) {
  const { data, error } = await consulta
  if (error) throw friendly(error)
  return data
}

// Apagar com RLS não dá erro quando não há permissão: apenas não apaga nada. Aqui isso vira erro.
async function apagar(consulta) {
  const linhas = await ok(consulta.select())
  if (!linhas || !linhas.length) throw new Error('Não foi possível apagar: você não tem permissão ou o registro não existe mais.')
}

// Primeiro dia do mês atual, no horário de Brasília (formato AAAA-MM-DD).
export function mesAtual() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7) + '-01'
}

/* ---------- Configurações: canais, regras e usuários ---------- */
export const canais = {
  list: () => ok(cliente().from('canais_slack').select('*').order('nome')),
  update: (chave, patch) => ok(cliente().from('canais_slack').update(patch).eq('chave', chave).select().single()),
}

export const regras = {
  list: () => ok(cliente().from('pontuacao_regras').select('*').order('chave')),
  update: (chave, pontos) => ok(cliente().from('pontuacao_regras').update({ pontos }).eq('chave', chave).select().single()),
}

// Criar login exige a chave secreta do projeto, que nunca pode ficar no navegador.
// Por isso essas duas ações passam pela função segura "admin-usuarios", que só aceita administradores.
async function chamarFuncao(nome, corpo) {
  const { data, error } = await cliente().functions.invoke(nome, { body: corpo })
  if (error) {
    let msg = ''
    try { const ctx = error.context; if (ctx && typeof ctx.json === 'function') msg = (await ctx.json()).erro || '' } catch { /* sem corpo legível */ }
    if (!msg && error.context && error.context.status === 404) throw new Error('A função de usuários não está publicada no Supabase. Peça a quem administra o projeto para publicar a função admin-usuarios.')
    throw msg ? new Error(msg) : friendly(error)
  }
  return data
}

export const usuarios = {
  get: (id) => ok(cliente().from('users').select('*').eq('id', id).maybeSingle()),
  list: () => ok(cliente().from('users').select('*').order('nome')),
  // Só o administrador altera (regra do banco). Ex.: { papel: 'aprovador' }, { ativo: false }, { admin: true, papel: 'aprovador' }.
  update: (id, patch) => ok(cliente().from('users').update(patch).eq('id', id).select().single()),
  // Cria o login e o perfil; devolve { usuario, senhaTemporaria }. A senha só aparece nesta resposta.
  criar: ({ nome, email, papel, admin }) => chamarFuncao('admin-usuarios', { acao: 'criar', nome, email, papel, admin: Boolean(admin) }),
  redefinirSenha: (id) => chamarFuncao('admin-usuarios', { acao: 'redefinir_senha', id }),
}

/* ---------- Colaboradores (lista de ativos, com histórico de períodos) ---------- */
export const colaboradores = {
  async list() {
    const [cs, ps] = await Promise.all([
      ok(cliente().from('colaboradores').select('*').order('nome_completo')),
      ok(cliente().from('colaborador_periodos').select('*')),
    ])
    return cs.map((c) => {
      const periodos = ps.filter((p) => p.colaborador_id === c.id)
      const aberto = periodos.find((p) => p.mes_fim === null)
      const ultimo = periodos.map((p) => p.mes_fim).filter(Boolean).sort().pop() || null
      return { ...c, periodos, ativo: Boolean(aberto), ultimoMes: aberto ? null : ultimo }
    })
  },
  previa: (lista) => ok(cliente().rpc('previa_lista_colaboradores', { p_lista: lista })),
  aplicar: (lista, arquivo, por) => ok(cliente().rpc('aplicar_lista_colaboradores', { p_lista: lista, p_arquivo: arquivo, p_por: por })),
  historico: () => ok(cliente().from('atualizacoes_lista').select('*').order('criado_em', { ascending: false }).limit(20)),
  // Ativar ou desativar à mão: fecha o período aberto ou abre um novo, a partir do mês atual.
  async alternar(c) {
    const mes = mesAtual()
    if (c.ativo) await ok(cliente().from('colaborador_periodos').update({ mes_fim: mes }).eq('colaborador_id', c.id).is('mes_fim', null))
    else await ok(cliente().from('colaborador_periodos').insert({ colaborador_id: c.id, mes_inicio: mes }))
  },
}

/* ---------- Posts: criação, aprovação, programação ---------- */
export const posts = {
  list: (status) => ok(cliente().from('posts').select('*').in('status', status).order('criado_em', { ascending: false })),
  create: (p) => ok(cliente().from('posts').insert(p).select().single()),
  update: (id, patch) => ok(cliente().from('posts').update(patch).eq('id', id).select().single()),
  remove: (id) => apagar(cliente().from('posts').delete().eq('id', id)),
  aprovar: (id, quando, por) =>
    posts.update(id, { status: 'programado', agendado_para: quando, aprovado_por: por, aprovado_em: new Date().toISOString(), motivo_devolucao: null }),
  devolver: (id, motivo) => posts.update(id, { status: 'devolvido', motivo_devolucao: motivo }),
  cancelar: (id, por) => posts.update(id, { status: 'cancelado', cancelado_por: por, cancelado_em: new Date().toISOString() }),
  voltar: (id) =>
    posts.update(id, { status: 'pendente', agendado_para: null, motivo_devolucao: null, aprovado_por: null, aprovado_em: null, cancelado_por: null, cancelado_em: null }),
}

/* ---------- Publicações e interações do Slack ---------- */
export const publicacoes = {
  list: () => ok(cliente().from('publicacoes_prazo').select('*')),
  // Registra que o post foi publicado no Slack (link da mensagem) e muda o status para "publicado".
  async registrar(postId, { publicado_em, slack_channel_id, slack_ts, por }) {
    const { error } = await cliente().from('post_publicacoes').insert({ post_id: postId, publicado_em, slack_channel_id, slack_ts, registrado_por: por })
    if (error) {
      const e = friendly(error)
      if (e.codigo !== '23505') throw e
      const ja = await ok(cliente().from('post_publicacoes').select('post_id').eq('post_id', postId))
      if (!ja.length) throw new Error('Este link do Slack já está registrado em outro post.')
    }
    return posts.update(postId, { status: 'publicado' })
  },
}

export const interacoes = {
  listByPosts: (ids) => (ids.length ? ok(cliente().from('post_interacoes').select('*').in('post_id', ids).order('momento')) : Promise.resolve([])),
  addManual: ({ post_id, nome, email, tipo, momento }) =>
    ok(cliente().from('post_interacoes').insert({ post_id, nome, email, tipo, origem: 'manual', momento }).select().single()),
  remove: (id) => apagar(cliente().from('post_interacoes').delete().eq('id', id)),
}

/* ---------- Post externo ---------- */
export const externos = {
  list: () => ok(cliente().from('posts_externos').select('*').order('data_publicacao', { ascending: false })),
  create: (x) => ok(cliente().from('posts_externos').insert(x).select().single()),
  remove: (id) => apagar(cliente().from('posts_externos').delete().eq('id', id)),
}

/* ---------- Ações de people ---------- */
export const acoes = {
  async list() {
    const [as, ps] = await Promise.all([
      ok(cliente().from('acoes_people').select('*').order('criado_em', { ascending: false })),
      ok(cliente().from('acao_participantes').select('*')),
    ])
    return as.map((a) => ({ ...a, participantes: ps.filter((p) => p.acao_id === a.id).map((p) => p.colaborador_id) }))
  },
  async create(acao, participantIds) {
    const a = await ok(cliente().from('acoes_people').insert(acao).select().single())
    const { error } = await cliente().from('acao_participantes').insert(participantIds.map((id) => ({ acao_id: a.id, colaborador_id: id })))
    if (error) {
      await cliente().from('acoes_people').delete().eq('id', a.id) // não deixa a ação pela metade
      throw friendly(error)
    }
    return a
  },
  remove: (id) => apagar(cliente().from('acoes_people').delete().eq('id', id)),
}

/* ---------- Rankings (calculados no banco) ---------- */
export const rankings = {
  mes: (mes) => ok(cliente().rpc('ranking_mes', { p_mes: mes })),
  async final() {
    const linhas = await ok(cliente().from('ranking_final').select('*'))
    const total = (r) => r.slack + r.externos + r.treinamento + r.destaque + r.social
    // Ativos primeiro; inativos sempre no fim.
    return linhas.map((r) => ({ ...r, total: total(r) })).sort((a, b) => (a.ativo_agora === b.ativo_agora ? b.total - a.total || a.nome_completo.localeCompare(b.nome_completo, 'pt-BR') : a.ativo_agora ? -1 : 1))
  },
  // Meses que têm alguma pontuação, do mais novo ao mais antigo (sempre inclui o mês atual).
  async meses() {
    const [pubs, ext] = await Promise.all([publicacoes.list(), externos.list()])
    const set = new Set([mesAtual().slice(0, 7)])
    pubs.forEach((p) => set.add(new Date(p.publicado_em).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7)))
    ext.forEach((x) => set.add(x.data_publicacao.slice(0, 7)))
    return [...set].sort().reverse()
  },
}

/* ---------- Arquivos (artes, prints e listas) no armazenamento privado "anexos" ---------- */
const urls = new Map()
export const anexos = {
  async enviar(pasta, file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const caminho = `${pasta}/${crypto.randomUUID()}${ext ? '.' + ext : ''}`
    const { error } = await cliente().storage.from('anexos').upload(caminho, file, { contentType: file.type || undefined, upsert: false })
    if (error) throw friendly(error)
    return caminho
  },
  // Link temporário (1 hora) para mostrar ou baixar o arquivo.
  async url(caminho) {
    if (urls.has(caminho)) return urls.get(caminho)
    const { data, error } = await cliente().storage.from('anexos').createSignedUrl(caminho, 3600)
    if (error) throw friendly(error)
    urls.set(caminho, data.signedUrl)
    return data.signedUrl
  },
}
