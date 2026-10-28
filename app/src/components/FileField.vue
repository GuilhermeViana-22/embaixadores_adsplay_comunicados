<script setup>
import { ref, watch } from 'vue'
import { Label } from '@/components/ui/label'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  accept: { type: String, default: '' },
  modelValue: { type: Object, default: null }, // o arquivo escolhido (File) ou null
  hint: { type: String, default: 'Tamanho máximo: 10 MB.' },
})
const emit = defineEmits(['update:modelValue'])

const input = ref(null)
function pick(event) {
  emit('update:modelValue', event.target.files[0] || null)
}
// Quando o formulário é limpo, limpa também o campo de arquivo.
watch(() => props.modelValue, (value) => {
  if (!value && input.value) input.value.value = ''
})
</script>

<template>
  <div class="space-y-2">
    <Label :for="id">{{ label }}</Label>
    <input
      :id="id"
      ref="input"
      type="file"
      :accept="accept"
      class="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-secondary-foreground focus-visible:ring-3"
      @change="pick"
    />
    <p class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
