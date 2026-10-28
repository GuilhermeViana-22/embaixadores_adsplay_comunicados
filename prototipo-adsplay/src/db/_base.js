// Base dos models fictícios. Todo arquivo <entidade>Db.js usa esta função.
// Os dados vivem só na memória: ao recarregar a página, voltam ao início.

export function createCollection(seed = []) {
  let items = seed.map((item) => ({ ...item }))
  let nextId = items.reduce((max, i) => Math.max(max, i.id), 0) + 1

  return {
    getAll: () => items.map((i) => ({ ...i })),
    getById: (id) => {
      const found = items.find((i) => i.id === id)
      return found ? { ...found } : null
    },
    create: (data) => {
      const item = { id: nextId++, ...data }
      items.push(item)
      return { ...item }
    },
    update: (id, data) => {
      const index = items.findIndex((i) => i.id === id)
      if (index === -1) return null
      items[index] = { ...items[index], ...data }
      return { ...items[index] }
    },
    remove: (id) => {
      const before = items.length
      items = items.filter((i) => i.id !== id)
      return items.length < before
    },
    reset: () => {
      items = seed.map((item) => ({ ...item }))
      nextId = items.reduce((max, i) => Math.max(max, i.id), 0) + 1
    },
  }
}
