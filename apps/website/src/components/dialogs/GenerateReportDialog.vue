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
import { generateReportPdf, generateReportXlsx } from '@smart-gen/reports'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { generateResumeForLLM, type ResumeForLLM } from '@/lib/generateResumeForLLM'
import { aiService } from '@/services/ai.service'

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

// Conversor assíncrono otimizado
const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): Promise<string> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer as BlobPart])
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve(base64 as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Função utilitária para lidar com a exportação/download nos diferentes ambientes
const exportFile = async (buffer: ArrayBuffer | Uint8Array, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    const base64Data = await bufferToBase64(buffer)

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    })

    await Share.share({
      title: 'Relatório do Gerador',
      url: savedFile.uri,
    })
  } else {
    const blob = new Blob([buffer as BlobPart], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

const handleGenerateReport = async () => {
  try {
    if (!selectedGenerator.value) return

    // Computa a data inicial com base no período selecionado
    const now = new Date()
    let startDate: Date | undefined

    const hoursMap: Record<string, number> = {
      '24h': 24,
      '7d': 7 * 24,
      '30d': 30 * 24,
      '90d': 90 * 24,
    }

    const hours = hoursMap[selectedPeriod.value]
    if (hours !== undefined) {
      startDate = new Date(now.getTime() - hours * 60 * 60 * 1000)
    }

    // Coleta os dados filtrados
    const generator = await getGeneratorById(supabase, selectedGenerator.value.id)
    const readings = await getReadingsByGeneratorId(supabase, selectedGenerator.value.id, startDate)

    const periodLabel = periodOptions.find((p) => p.value === selectedPeriod.value)?.label
    const safeFileName = `relatorio-${(generator.name ?? generator.id).replace(/\s+/g, '-').toLowerCase()}`

    const resume = generateResumeForLLM(readings, selectedPeriod.value)
    const generatedResume = await aiService.generateResume(resume as ResumeForLLM)

    if (selectedFormat.value === 'pdf') {
      const pdfBytes = await generateReportPdf(
        generator,
        readings,
        periodLabel,
        generatedResume?.diagnostic,
        generatedResume?.provider,
      )
      await exportFile(pdfBytes, `${safeFileName}.pdf`, 'application/pdf')
    } else if (selectedFormat.value === 'xlsx') {
      const xlsxBuffer = await generateReportXlsx(generator, readings, periodLabel)
      await exportFile(
        xlsxBuffer,
        `${safeFileName}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
    }

    emit('update:open', false)
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
        <div class="space-y-2">
          <Label for="period-select">Período</Label>
          <Select v-model="selectedPeriod">
            <SelectTrigger id="period-select" class="w-full bg-gray-100">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in periodOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-4">
          <Label>Formato do relatório</Label>
          <RadioGroup v-model="selectedFormat" class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <RadioGroupItem class="bg-gray-100" id="format-pdf" value="pdf" />
              <Label for="format-pdf" class="font-normal cursor-pointer">PDF</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem class="bg-gray-100" id="format-xlsx" value="xlsx" />
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
