import { postDb, interacaoDb, colaboradorDb, postExternoDb, acaoPeopleDb } from '@/db'
import { parseDate, monthKey, toLocalIso } from './dates.js'
import { postDeadline } from './businessHours.js'

// Pontos por tipo de registro. 1 ponto por comentário e 1 por reação ficam em SLACK_POINT.
export const SLACK_POINT = 1
export const POINTS = { external: 50, treinamento: 50, destaque: 100, social: 50 }

export const actionLabels = { treinamento: 'Treinamento', destaque: 'Destaque do quarter', social: 'Ação social do quarter' }

// Interação vale se foi feita entre a publicação e o fim das 24 horas úteis.
export function isOnTime(interaction, post) {
  const at = parseDate(interaction.at)
  return at >= parseDate(post.publishedAt) && at <= postDeadline(post)
}

// O prazo do post já terminou? Só então os pontos entram no ranking.
export const isClosed = (post, now = new Date()) =>
  post.status === 'publicado' && now >= postDeadline(post)

export const deadlineLabel = (post) => toLocalIso(postDeadline(post))

export function postStats(postId) {
  const items = interacaoDb.getAll().filter((i) => i.postId === postId)
  const comments = items.filter((i) => i.type === 'comentario').length
  return { comments, reactions: items.length - comments }
}

// Meses com algum registro, do mais novo para o mais antigo, sempre incluindo o mês atual.
export function availableMonths(now = new Date()) {
  const keys = new Set([monthKey(toLocalIso(now))])
  postDb.getAll().filter((p) => p.publishedAt).forEach((p) => keys.add(monthKey(p.publishedAt)))
  postExternoDb.getAll().forEach((p) => keys.add(monthKey(p.date)))
  return [...keys].sort().reverse()
}

// Ranking de colaboradores ativos. month = "2026-10"; sem month = ranking final (soma tudo + ações de people).
export function computeRanking({ month = null, now = new Date() } = {}) {
  const final = !month
  const rows = new Map(
    colaboradorDb.getAll().filter((c) => c.active).map((c) => [c.id, { colaborador: c, slack: 0, external: 0, actions: 0, total: 0 }]),
  )

  const interactions = interacaoDb.getAll()
  postDb.getAll()
    .filter((p) => isClosed(p, now) && (final || monthKey(p.publishedAt) === month))
    .forEach((post) => {
      const seen = new Set() // no máximo 1 comentário e 1 reação por pessoa em cada post
      interactions.filter((i) => i.postId === post.id && isOnTime(i, post)).forEach((i) => {
        const key = `${i.colaboradorId}-${i.type}`
        const row = rows.get(i.colaboradorId)
        if (!row || seen.has(key)) return
        seen.add(key)
        row.slack += SLACK_POINT
      })
    })

  postExternoDb.getAll()
    .filter((p) => final || monthKey(p.date) === month)
    .forEach((p) => { const row = rows.get(p.colaboradorId); if (row) row.external += POINTS.external })

  if (final) {
    acaoPeopleDb.getAll().forEach((a) => a.participantIds.forEach((id) => {
      const row = rows.get(id)
      if (row) row.actions += POINTS[a.type]
    }))
  }

  return [...rows.values()]
    .map((r) => ({ ...r, total: r.slack + r.external + r.actions }))
    .sort((a, b) => b.total - a.total || a.colaborador.name.localeCompare(b.colaborador.name, 'pt-BR'))
}
