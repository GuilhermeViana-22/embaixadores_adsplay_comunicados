<script setup>
import { onMounted, ref } from 'vue'
import { anexos } from '@/services/api'
import FilePlaceholder from '@/components/FilePlaceholder.vue'

// Mostra a imagem guardada no Supabase (link temporário). Se não for imagem, mostra o nome do arquivo.
const props = defineProps({ caminho: { type: String, default: '' }, nome: { type: String, default: '' } })
const url = ref('')
const falhou = ref(false)
const ehImagem = /\.(png|jpe?g|gif|webp)$/i.test(props.caminho || props.nome)

onMounted(async () => {
  if (!props.caminho || !ehImagem) return
  try { url.value = await anexos.url(props.caminho) } catch { falhou.value = true }
})
</script>

<template>
  <img v-if="url && !falhou" :src="url" :alt="`Arte: ${nome}`" class="aspect-square w-32 rounded-xl border object-cover md:w-full" @error="falhou = true" />
  <FilePlaceholder v-else :name="nome || 'arquivo'" />
</template>
