<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui'
import { useGeneratorsStore } from '@/stores/generators.store'
import { supabase } from '@/lib/supabase'
import { getGeneratorById, getReadingsByGeneratorId } from '@smart-gen/supabase'
import { generateReportPdf } from '@smart-gen/reports'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const generatorsStore = useGeneratorsStore()
const { selectedGenerator } = storeToRefs(generatorsStore)

const selectedPeriod = ref('7d')
const selectedFormat = ref('pdf')

const periodOptions = [
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
]

const handleGenerateReport = async () => {
  try {
    if (!selectedGenerator.value) return

    // Computa a data inicial com base no período selecionado
    const now = new Date()
    let startDate: Date | undefined

    if (selectedPeriod.value === '24h') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else if (selectedPeriod.value === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (selectedPeriod.value === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (selectedPeriod.value === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }

    // Coleta os dados já filtrados no banco
    const generator = await getGeneratorById(supabase, selectedGenerator.value.id)
    const readings = await getReadingsByGeneratorId(supabase, selectedGenerator.value.id, startDate)

    const periodLabel = periodOptions.find((p) => p.value === selectedPeriod.value)?.label

    // Envia para o pacote de relatórios e recebe de volta o arquivo Pdf em Uint8Array
    if (selectedFormat.value === 'pdf') {
      const pdfBytes = await generateReportPdf(generator, readings, periodLabel)

      // Cria o blob e força o download no navegador
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const generatorNameForFile = generator.name ?? generator.id
      link.download = `relatorio-${generatorNameForFile.replace(/\s+/g, '-').toLowerCase()}.pdf`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      emit('update:open', false)
    }
  } catch (error: unknown) {
    console.error('Erro ao gerar relatório:', error)
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-md md:max-w-lg">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold">
          Gerar Relatório para "{{ selectedGenerator?.name ?? 'Nenhum gerador' }}"
        </DialogTitle>
        <DialogDescription class="text-gray-600 dark:text-slate-400">
          Configure as opções abaixo para exportar o relatório de leituras do gerador selecionado.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-5 mt-2">
        <!-- Seletor de Período -->
        <div class="space-y-2">
          <Label for="period-select">Período</Label>
          <Select v-model="selectedPeriod">
            <SelectTrigger id="period-select" class="w-full">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in periodOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Formato do Relatório -->
        <div class="space-y-2">
          <Label>Formato do relatório</Label>
          <RadioGroup v-model="selectedFormat" class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="format-pdf" value="pdf" />
              <Label for="format-pdf" class="font-normal cursor-pointer">PDF</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="format-xlsx" value="xlsx" />
              <Label for="format-xlsx" class="font-normal cursor-pointer">XLSX</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <DialogFooter class="pt-4">
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button
          type="button"
          @click="handleGenerateReport"
          :disabled="!selectedGenerator"
          class="min-w-32.5"
        >
          Gerar Relatório
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
