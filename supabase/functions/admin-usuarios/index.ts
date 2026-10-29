import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
import { tratar } from './logic.js'

// A chave secreta fica só aqui, no servidor do Supabase. Ela é entregue à função pelo próprio Supabase.
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve((req: Request) => tratar(req, { admin }))
