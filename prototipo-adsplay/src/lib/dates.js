// Datas guardadas como texto local "AAAA-MM-DDTHH:mm" (ou só "AAAA-MM-DD").
export const parseDate = (value) => new Date(value)

const pad = (n) => String(n).padStart(2, '0')

export function toLocalIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDate(value) {
  if (!value) return '—'
  return parseDate(value).toLocaleDateString('pt-BR')
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = parseDate(value)
  return `${date.toLocaleDateString('pt-BR')} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// "2026-10" a partir de uma data
export function monthKey(value) {
  const date = parseDate(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function monthLabel(key) {
  const label = new Date(`${key}-15T12:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Data de exemplo relativa a agora, para sempre haver um post dentro do prazo.
export const hoursFromNow = (hours) => toLocalIso(new Date(Date.now() + hours * 36e5))
