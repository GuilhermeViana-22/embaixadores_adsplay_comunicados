// A pessoa estava ativa naquele mês ("AAAA-MM")? Usa os períodos guardados no banco.
export function ativoEm(colaborador, mes) {
  const m = `${mes.slice(0, 7)}-01`
  return (colaborador.periodos || []).some((p) => (!p.mes_inicio || p.mes_inicio <= m) && (!p.mes_fim || m <= p.mes_fim))
}
