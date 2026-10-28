import { defineStore } from 'pinia'
import { ref } from 'vue'

// Estado compartilhado pelos dois rankings: último arquivo de colaboradores ativos "cadastrado" (simulado).
// "version" muda quando a lista muda, para os rankings recalcularem.
export const useRosterStore = defineStore('roster', () => {
  const fileName = ref('')
  const registeredAt = ref('')
  const version = ref(0)

  function register(name) {
    fileName.value = name
    registeredAt.value = new Date().toISOString()
    version.value++
  }
  function touch() { version.value++ }

  return { fileName, registeredAt, version, register, touch }
})
