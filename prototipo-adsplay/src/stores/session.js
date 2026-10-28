import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { userDb } from '@/db'

// Sessão fictícia: quem está "logado" no mockup. Não há autenticação real.
export const useSessionStore = defineStore('session', () => {
  const userId = ref(null)
  const loggedIn = ref(false)
  const version = ref(0) // muda quando o usuário é editado, para as telas relerem os dados

  const user = computed(() => {
    version.value
    return userId.value ? userDb.getById(userId.value) : null
  })
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Permissões do protótipo não protegem nada; só mostram ou escondem ações.
  const can = (key) => !!user.value?.permissions.includes(key)

  function refresh() { version.value++ }
  function login(id) { userId.value = id; loggedIn.value = true; refresh() }
  function logout() { loggedIn.value = false; userId.value = null }

  return { userId, loggedIn, user, isAdmin, can, refresh, login, logout }
})
