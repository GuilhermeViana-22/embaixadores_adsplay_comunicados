import { createClient } from '@supabase/supabase-js'

// Os dois valores vêm do arquivo .env (modelo em .env.example). A chave é a PÚBLICA:
// quem protege os dados são as regras do banco (RLS), não o sigilo desta chave.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configurado = Boolean(url && key)
export const supabase = configurado
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export const MENSAGEM_SEM_CONFIG =
  'O Supabase não está configurado. Copie o arquivo .env.example para .env, preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY e reinicie o servidor.'
