import { ref } from 'vue'

// Executa uma ação que fala com o Supabase, guarda a mensagem de erro e controla o "carregando".
// Devolve { ok, dados }: ok é false quando deu erro (a mensagem fica em `erro`).
export function useAction() {
  const erro = ref('')
  const ocupado = ref(false)
  async function run(fn) {
    erro.value = ''
    ocupado.value = true
    try {
      return { ok: true, dados: await fn() }
    } catch (e) {
      erro.value = (e && e.message) || String(e)
      return { ok: false, dados: null }
    } finally {
      ocupado.value = false
    }
  }
  return { erro, ocupado, run }
}
