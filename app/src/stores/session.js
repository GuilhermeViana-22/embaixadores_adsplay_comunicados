import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminExtra, permissionsByRole } from '@/config/app'
import { friendly } from '@/lib/errors'
import { MENSAGEM_SEM_CONFIG, supabase } from '@/lib/supabase'
import { usuarios } from '@/services/api'

// Sessão real: login do Supabase Auth + perfil da tabela users (papel Aprovador ou People).
export const useSessionStore = defineStore('session', () => {
  const user = ref(null)
  const profile = ref(null)
  const ready = ref(false)
  const erro = ref('')
  let iniciando = null

  const logado = computed(() => Boolean(user.value && profile.value && profile.value.ativo))
  const isAprovador = computed(() => logado.value && profile.value.papel === 'aprovador')
  // Administrador: único que cria e gerencia usuários (sempre é Aprovador também).
  const isAdmin = computed(() => logado.value && profile.value.admin === true)
  // Quem foi criado pelo administrador entra com uma senha temporária e precisa trocá-la.
  const precisaTrocarSenha = computed(() => Boolean(user.value && user.value.user_metadata && user.value.user_metadata.trocar_senha === true))
  // Só mostra ou esconde botões; quem de fato bloqueia é o banco.
  const can = (key) => logado.value && ((permissionsByRole[profile.value.papel] || []).includes(key) || (isAdmin.value && adminExtra.includes(key)))

  async function carregarPerfil() {
    profile.value = null
    if (!user.value) return
    try { profile.value = await usuarios.get(user.value.id) } catch (e) { erro.value = e.message }
  }

  function init() {
    if (iniciando) return iniciando
    iniciando = (async () => {
      if (!supabase) { erro.value = MENSAGEM_SEM_CONFIG; ready.value = true; return }
      try {
        const { data } = await supabase.auth.getSession()
        user.value = (data.session && data.session.user) || null
        await carregarPerfil()
      } catch (e) { erro.value = friendly(e).message }
      ready.value = true
      // Não chame o banco aqui dentro: só atualiza o estado.
      supabase.auth.onAuthStateChange((evento, sessao) => {
        if (evento === 'SIGNED_OUT') { user.value = null; profile.value = null }
        else if (sessao) user.value = sessao.user
      })
    })()
    return iniciando
  }

  async function entrar(email, senha) {
    if (!supabase) throw new Error(MENSAGEM_SEM_CONFIG)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw friendly(error)
    user.value = data.user
    await carregarPerfil()
    if (!profile.value) {
      await supabase.auth.signOut()
      user.value = null
      throw new Error('Você entrou, mas a sua conta ainda não tem perfil no sistema. Peça ao Aprovador para cadastrá-la.')
    }
    if (!profile.value.ativo) {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
      throw new Error('A sua conta está desativada. Fale com o Aprovador.')
    }
  }

  async function sair() {
    if (supabase) { try { await supabase.auth.signOut() } catch { /* já saiu neste navegador */ } }
    user.value = null
    profile.value = null
  }

  // Envia o e-mail com o link de recuperação. O endereço de volta precisa estar na lista "Redirect URLs" do Supabase.
  async function recuperarSenha(email) {
    if (!supabase) throw new Error(MENSAGEM_SEM_CONFIG)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` })
    if (error) throw friendly(error)
  }

  // Troca a senha e tira a marca de "senha temporária".
  async function trocarSenha(nova) {
    const { data, error } = await supabase.auth.updateUser({ password: nova, data: { trocar_senha: false } })
    if (error) throw friendly(error)
    if (data && data.user) user.value = data.user
  }

  return { user, profile, ready, erro, logado, isAprovador, isAdmin, precisaTrocarSenha, can, init, entrar, sair, recuperarSenha, trocarSenha, carregarPerfil }
})
