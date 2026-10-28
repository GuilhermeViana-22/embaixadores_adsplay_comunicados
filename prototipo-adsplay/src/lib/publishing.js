import { postDb } from '@/db'
import { parseDate, toLocalIso } from './dates.js'

// Publicação simulada: na versão real, o Slack posta no horário aprovado.
export function publishNow(post) {
  return postDb.update(post.id, { status: 'publicado', publishedAt: toLocalIso(new Date()) })
}

// Publica os posts programados cujo horário já chegou. Devolve quantos foram publicados.
export function publishDue(now = new Date()) {
  const due = postDb.getAll().filter((p) => p.status === 'programado' && p.scheduledAt && parseDate(p.scheduledAt) <= now)
  due.forEach((p) => postDb.update(p.id, { status: 'publicado', publishedAt: p.scheduledAt }))
  return due.length
}
