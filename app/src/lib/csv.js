// Leitura simples de CSV (Excel em português usa ";"; outros usam ","). Aceita aspas e BOM.
export async function lerTexto(file) {
  const buf = await file.arrayBuffer()
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) }
  catch { return new TextDecoder('windows-1252').decode(buf) } // CSV salvo pelo Excel antigo
}

export function parseCsv(texto) {
  const t = texto.replace(/^\uFEFF/, '')
  const primeira = t.split(/\r?\n/).find((l) => l.trim()) || ''
  const sep = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ';' : ','
  const linhas = []
  let campo = '', linha = [], aspas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') aspas = false
      else campo += c
    } else if (c === '"') aspas = true
    else if (c === sep) { linha.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      linha.push(campo); campo = ''
      if (linha.some((x) => x.trim())) linhas.push(linha)
      linha = []
    } else campo += c
  }
  linha.push(campo)
  if (linha.some((x) => x.trim())) linhas.push(linha)
  return linhas.map((l) => l.map((x) => x.trim()))
}

const CABECALHO = /^(nome( completo)?|name|e-?mail( corporativo)?|colaboradores?|participantes?|presen[cç]a|assinatura|cargo|[áa]rea|setor|status|situa[cç][aã]o|#)$/i

// Devolve [{ nome, email }]. Usa o cabeçalho (nome / e-mail) quando existe; senão, adivinha pela linha.
export function parseColaboradores(linhas) {
  let ci = -1, ni = -1, inicio = 0
  const h = linhas.findIndex((l) => l.some((c) => /e-?mail/i.test(c)))
  if (h >= 0) {
    ci = linhas[h].findIndex((c) => /e-?mail/i.test(c))
    ni = linhas[h].findIndex((c) => /^(nome|name|colaborador)/i.test(c))
    inicio = h + 1
  }
  const vistos = new Set(), saida = []
  let semEmail = 0
  for (const l of linhas.slice(inicio)) {
    const cel = l.filter(Boolean)
    if (!cel.length || cel.every((x) => CABECALHO.test(x))) continue
    const email = (ci >= 0 ? l[ci] : cel.find((x) => /^\S+@\S+\.\S+$/.test(x))) || ''
    const nome = (ni >= 0 ? l[ni] : cel.find((x) => x !== email && /[a-zà-ú]{2}/i.test(x) && !x.includes('@'))) || ''
    if (!nome) continue
    const k = (email || nome).toLowerCase()
    if (vistos.has(k)) continue
    vistos.add(k)
    if (!email) semEmail++
    saida.push({ nome, email: email.toLowerCase() })
  }
  return { lista: saida, semEmail }
}
