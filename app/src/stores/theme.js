import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'comunicados-theme'

// Cores primárias sugeridas. A pessoa também pode escolher qualquer cor.
export const colorPresets = [
  { name: 'Lilás', value: '#b794e8' },
  { name: 'Lavanda', value: '#a78bfa' },
  { name: 'Orquídea', value: '#c78ce0' },
  { name: 'Violeta', value: '#7c3aed' },
  { name: 'Ameixa', value: '#6b3fa0' },
  { name: 'Grafite', value: '#27272a' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* sem armazenamento: segue sem salvar */ }
}

// Escolhe texto claro ou escuro sobre a cor, para manter a leitura.
function readableOn(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#18181b' : '#fafafa'
}

export const useThemeStore = defineStore('theme', () => {
  const saved = load()
  const mode = ref(saved.mode || 'system') // 'light' | 'dark' | 'system'
  const primary = ref(saved.primary || null) // null = cor padrão do tema

  function apply() {
    const dark = mode.value === 'dark' || (mode.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    if (primary.value) {
      root.style.setProperty('--primary', primary.value)
      root.style.setProperty('--primary-foreground', readableOn(primary.value))
      root.style.setProperty('--ring', primary.value)
    } else {
      ;['--primary', '--primary-foreground', '--ring'].forEach((p) => root.style.removeProperty(p))
    }
  }
  function setMode(value) { mode.value = value; save({ mode: mode.value, primary: primary.value }); apply() }
  function setPrimary(value) { primary.value = value; save({ mode: mode.value, primary: primary.value }); apply() }
  function reset() { mode.value = 'system'; primary.value = null; save({}); apply() }

  return { mode, primary, apply, setMode, setPrimary, reset }
})
