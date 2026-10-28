// Comentários e reações dos posts (no protótipo, lançados à mão; na versão real viriam do Slack).
// type: 'comentario' | 'reacao'. colaboradorId aponta para colaboradorDb.
import { createCollection } from './_base.js'
import { hoursFromNow } from '@/lib/dates.js'

const row = (postId, colaboradorId, type, at) => ({ postId, colaboradorId, type, at })

const rows = [
  // Post 1 (publicado seg 05/10 10:00; prazo ter 06/10 10:00)
  row(1, 1, 'comentario', '2026-10-05T10:20'), row(1, 1, 'reacao', '2026-10-05T10:05'),
  row(1, 2, 'reacao', '2026-10-05T11:00'), row(1, 2, 'comentario', '2026-10-06T09:30'),
  row(1, 3, 'reacao', '2026-10-05T14:10'),
  row(1, 4, 'comentario', '2026-10-06T09:55'), row(1, 4, 'reacao', '2026-10-06T09:56'),
  row(1, 5, 'comentario', '2026-10-06T15:00'),
  row(1, 6, 'reacao', '2026-10-07T09:00'),
  row(1, 11, 'comentario', '2026-10-05T12:00'),
  // Post 2 (publicado sex 09/10 15:00; prazo seg 12/10 15:00, fim de semana não conta)
  row(2, 1, 'reacao', '2026-10-09T15:30'),
  row(2, 3, 'comentario', '2026-10-10T10:00'),
  row(2, 4, 'reacao', '2026-10-12T14:00'),
  row(2, 5, 'comentario', '2026-10-12T16:00'),
  row(2, 7, 'comentario', '2026-10-09T16:00'), row(2, 7, 'reacao', '2026-10-09T16:02'),
  row(2, 8, 'reacao', '2026-10-13T09:00'),
  // Post 3 (publicado seg 28/09 09:00; prazo ter 29/09 09:00)
  row(3, 1, 'comentario', '2026-09-28T09:30'), row(3, 1, 'reacao', '2026-09-28T09:31'),
  row(3, 2, 'reacao', '2026-09-28T10:00'),
  row(3, 3, 'comentario', '2026-09-29T08:50'),
  row(3, 9, 'reacao', '2026-09-28T11:00'), row(3, 9, 'comentario', '2026-09-30T10:00'),
  row(3, 10, 'comentario', '2026-09-28T15:00'),
  // Post 4 (publicado qui 22/10 11:00; prazo sex 23/10 11:00)
  row(4, 2, 'comentario', '2026-10-22T11:30'), row(4, 2, 'reacao', '2026-10-22T11:31'),
  row(4, 4, 'reacao', '2026-10-23T10:50'),
  row(4, 9, 'comentario', '2026-10-22T17:00'), row(4, 9, 'reacao', '2026-10-22T17:05'),
  row(4, 10, 'reacao', '2026-10-23T11:30'),
  // Post 5 (publicado há 3 horas, ainda dentro do prazo)
  row(5, 6, 'reacao', hoursFromNow(-2)),
  row(5, 8, 'comentario', hoursFromNow(-1)),
]

export const interacaoDb = createCollection(rows.map((r, i) => ({ id: i + 1, ...r })))
