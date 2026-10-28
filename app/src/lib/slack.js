// Lê o link "Copiar link da mensagem" do Slack e devolve canal, identificador e hora da mensagem.
export function parseSlackLink(url) {
  const m = String(url).match(/archives\/([A-Z0-9]+)\/p(\d{10})(\d{6})/)
  if (!m) return null
  return { channelId: m[1], ts: `${m[2]}.${m[3]}`, publicadoEm: new Date(Number(m[2]) * 1000).toISOString() }
}
