import { parseDate } from './dates.js'

// Soma horas úteis a uma data: sábado e domingo não contam.
export function addBusinessHours(start, hours) {
  let cursor = new Date(start)
  let left = hours * 36e5
  while (left > 0) {
    const day = cursor.getDay()
    if (day === 0 || day === 6) {
      // pula para a segunda-feira à meia-noite
      cursor.setDate(cursor.getDate() + (day === 6 ? 2 : 1))
      cursor.setHours(0, 0, 0, 0)
      continue
    }
    const endOfDay = new Date(cursor)
    endOfDay.setHours(24, 0, 0, 0)
    const step = Math.min(left, endOfDay - cursor)
    cursor = new Date(cursor.getTime() + step)
    left -= step
  }
  return cursor
}

// Prazo de pontuação de um post: 24 horas úteis depois da publicação.
export const SCORING_WINDOW_HOURS = 24
export const postDeadline = (post) => addBusinessHours(parseDate(post.publishedAt), SCORING_WINDOW_HOURS)
