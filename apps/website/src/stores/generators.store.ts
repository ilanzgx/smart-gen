import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getGenerators, type Generator } from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'

export const useGeneratorsStore = defineStore('generators', () => {
  const generators = ref<Generator[]>([])
  const selectedGeneratorId = ref<string>('')

  const selectedGenerator = computed(
    () => generators.value.find((g) => g.id === selectedGeneratorId.value) || null,
  )

  /**
   * Busca todos os geradores do banco de dados e seleciona o primeiro automaticamente.
   */
  const fetchGenerators = async () => {
    const response = await getGenerators(supabase)

    generators.value = response

    if (response.length > 0 && !selectedGeneratorId.value) {
      selectedGeneratorId.value = response[0]!.id
    }
  }

  return {
    generators,
    selectedGeneratorId,
    selectedGenerator,
    fetchGenerators,
  }
})
