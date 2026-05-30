<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
import { Capacitor, registerPlugin } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { generateResumeForLLM } from '@/lib/generateResumeForLLM'
import { aiService } from '@/services/ai.service'
import { Loader2, Check, CircleAlert } from 'lucide-vue-next'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const NativeFileOpener = registerPlugin<{
  openFile: (options: { path: string; mimeType: string }) => Promise<void>
}>('NativeFileOpener')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetSteps()
  },
)

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

type StepStatus = 'idle' | 'loading' | 'done' | 'error'

interface GenerationStep {
  key: string
  label: string
  status: StepStatus
}

const isGenerating = ref(false)
const isComplete = ref(false)
const generationError = ref<string | null>(null)

const pdfSteps = ref<GenerationStep[]>([
  { key: 'fetch', label: 'Buscando dados do gerador', status: 'idle' },
  { key: 'ai', label: 'Aguardando resposta da IA', status: 'idle' },
  { key: 'generate', label: 'Gerando documento PDF', status: 'idle' },
])

const xlsxSteps = ref<GenerationStep[]>([
  { key: 'fetch', label: 'Buscando dados do gerador', status: 'idle' },
  { key: 'generate', label: 'Gerando planilha XLSX', status: 'idle' },
])

const activeSteps = computed(() =>
  selectedFormat.value === 'pdf' ? pdfSteps.value : xlsxSteps.value,
)

function resetSteps() {
  pdfSteps.value.forEach((s) => (s.status = 'idle'))
  xlsxSteps.value.forEach((s) => (s.status = 'idle'))
  generationError.value = null
  isComplete.value = false
}

function setStepStatus(steps: GenerationStep[], key: string, status: StepStatus) {
  const step = steps.find((s) => s.key === key)
  if (step) step.status = status
}

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
    try {
      const base64Data = await bufferToBase64(buffer)

      // Salva o arquivo no cache do app
      const savedFile = await Filesystem.writeFile({
        path: fileName.replace(/\//g, '-'),
        data: base64Data,
        directory: Directory.Cache,
      })

      // Aciona o código nativo customizado passando a URI do arquivo e o tipo (PDF ou Excel)
      await NativeFileOpener.openFile({
        path: savedFile.uri,
        mimeType: mimeType,
      })
    } catch (e: unknown | Error) {
      console.error('Erro ao exportar no mobile:', e)
      alert(`Não foi possível abrir o relatório: ${(e as Error).message}`)
    }
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
  if (!selectedGenerator.value || isGenerating.value) return

  isGenerating.value = true
  resetSteps()

  const steps = activeSteps.value

  try {
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

    // Passo 1: Buscar dados
    setStepStatus(steps, 'fetch', 'loading')
    const generator = await getGeneratorById(supabase, selectedGenerator.value.id)
    const readings = await getReadingsByGeneratorId(supabase, selectedGenerator.value.id, startDate)
    setStepStatus(steps, 'fetch', 'done')

    const periodLabel = periodOptions.find((p) => p.value === selectedPeriod.value)?.label
    const safeFileName = `relatorio-${(generator.name ?? generator.id).replace(/\s+/g, '-').toLowerCase()}`

    if (selectedFormat.value === 'pdf') {
      // Passo 2: IA
      setStepStatus(steps, 'ai', 'loading')
      const resume = generateResumeForLLM(readings, selectedPeriod.value)

      let generatedResume = null
      if (resume) {
        generatedResume = await aiService.generateResume(resume)
      }
      setStepStatus(steps, 'ai', 'done')

      // Passo 3: Gerar documento
      setStepStatus(steps, 'generate', 'loading')
      const pdfBytes = await generateReportPdf(
        generator,
        readings,
        periodLabel,
        generatedResume?.diagnostic,
        generatedResume?.provider,
      )
      await exportFile(pdfBytes, `${safeFileName}.pdf`, 'application/pdf')
      setStepStatus(steps, 'generate', 'done')
    } else if (selectedFormat.value === 'xlsx') {
      // Passo 2: Gerar planilha
      setStepStatus(steps, 'generate', 'loading')
      const xlsxBuffer = await generateReportXlsx(generator, readings, periodLabel)
      await exportFile(
        xlsxBuffer,
        `${safeFileName}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      setStepStatus(steps, 'generate', 'done')
    }

    // Aguarda o usuário ver o resultado final antes de fechar
    isComplete.value = true
    await new Promise((r) => setTimeout(r, 1500))
    emit('update:open', false)
  } catch (error: unknown) {
    console.error('Erro ao gerar relatório:', error)
    generationError.value = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'

    for (const step of steps) {
      if (step.status === 'loading') step.status = 'error'
    }
  } finally {
    isGenerating.value = false
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
          <Select v-model="selectedPeriod" :disabled="isGenerating">
            <SelectTrigger id="period-select" class="w-full bg-gray-100 dark:bg-slate-800">
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
          <RadioGroup
            v-model="selectedFormat"
            class="flex items-center gap-6"
            :disabled="isGenerating"
          >
            <div class="flex items-center gap-2">
              <RadioGroupItem class="bg-gray-100 dark:bg-slate-800" id="format-pdf" value="pdf" />
              <Label for="format-pdf" class="font-normal cursor-pointer">PDF</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem class="bg-gray-100 dark:bg-slate-800" id="format-xlsx" value="xlsx" />
              <Label for="format-xlsx" class="font-normal cursor-pointer">XLSX</Label>
            </div>
          </RadioGroup>
        </div>

        <!-- Progresso de geração -->
        <Transition name="steps-fade">
          <div
            v-if="isGenerating || activeSteps.some((s) => s.status !== 'idle')"
            class="pt-2 space-y-1"
          >
            <div
              v-for="step in activeSteps"
              :key="step.key"
              class="flex items-center gap-2 py-1 transition-all duration-300"
            >
              <!-- Indicador -->
              <Loader2
                v-if="step.status === 'loading'"
                class="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400 animate-spin"
              />
              <Check
                v-else-if="step.status === 'done'"
                class="w-3.5 h-3.5 shrink-0 text-emerald-500 dark:text-emerald-400"
              />
              <CircleAlert
                v-else-if="step.status === 'error'"
                class="w-3.5 h-3.5 shrink-0 text-red-500 dark:text-red-400"
              />
              <span
                v-else
                class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 ml-1 mr-0.5"
              />

              <!-- Label -->
              <span
                class="text-[13px] transition-colors duration-300"
                :class="{
                  'text-slate-400 dark:text-slate-500': step.status === 'idle',
                  'text-slate-600 dark:text-slate-300': step.status === 'loading',
                  'text-emerald-600 dark:text-emerald-400': step.status === 'done',
                  'text-red-600 dark:text-red-400': step.status === 'error',
                }"
              >
                {{ step.label }}
              </span>
            </div>

            <!-- Mensagem de erro -->
            <p
              v-if="generationError"
              class="text-[13px] text-red-500 dark:text-red-400 pl-5.5 pt-0.5"
            >
              {{ generationError }}
            </p>
          </div>
        </Transition>
      </div>

      <DialogFooter class="pt-4">
        <DialogClose as-child>
          <Button type="button" variant="outline" :disabled="isGenerating">Cancelar</Button>
        </DialogClose>
        <Button
          type="button"
          @click="handleGenerateReport"
          :disabled="!selectedGenerator || isGenerating"
          class="min-w-32.5"
        >
          <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin" />
          {{ isGenerating ? 'Gerando...' : 'Gerar Relatório' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.steps-fade-enter-active,
.steps-fade-leave-active {
  transition: all 0.3s ease;
}

.steps-fade-enter-from,
.steps-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
