// Traduz os erros do Supabase para mensagens que a pessoa entende.
export function friendly(e) {
  const msg = String((e && e.message) || e || '')
  const code = String((e && (e.code || e.error_code)) || '')
  let t
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) t = 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  else if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) t = 'E-mail ou senha incorretos.'
  else if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) t = 'Este e-mail ainda não foi confirmado.'
  else if (code === 'over_request_rate_limit' || /rate limit|too many/i.test(msg)) t = 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  else if (code === 'same_password' || /different from the old/i.test(msg)) t = 'A nova senha precisa ser diferente da atual.'
  else if (code === 'weak_password') t = 'Senha fraca. Use no mínimo 8 caracteres, misturando letras e números.'
  else if (code === '42501' || /row-level security|permission denied|violates row-level/i.test(msg)) t = 'Você não tem permissão para esta ação.'
  else if (code === '23505') t = 'Já existe um registro com esses dados.'
  else if (code === '23503') t = 'Este registro está em uso por outros dados e não pode ser removido.'
  else if (code === '23514') t = 'Dados inválidos. Confira os campos (por exemplo, devolver exige o motivo e programar exige data e horário).'
  else if (code === '23502') t = 'Preencha todos os campos obrigatórios.'
  else if (code === 'PGRST116') t = 'Registro não encontrado, ou você não tem permissão para ele.'
  else if (/jwt expired|invalid jwt|jwt/i.test(msg)) t = 'Sessão expirada. Entre de novo.'
  else if (/mime type|not allowed/i.test(msg)) t = 'Tipo de arquivo não permitido. Use imagem, PDF, CSV ou Excel.'
  else if (/maximum allowed size|too large|payload/i.test(msg)) t = 'Arquivo grande demais. O máximo é 10 MB.'
  else t = msg || 'Não deu certo. Tente de novo.'
  const err = new Error(t)
  err.codigo = code
  err.original = msg
  return err
}
