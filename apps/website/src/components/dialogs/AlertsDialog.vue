<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
  Skeleton,
} from '@/components/ui'
import { getCriticalReadings, type Leitura } from '@smart-gen/supabase'
import { TEMP_CRITICA, NIVEL_AGUA_CRITICO } from '@smart-gen/shared'
import { supabase } from '@/lib/supabase'
import { useGeneratorsStore } from '@/stores/generators.store'
import {
  AlertTriangle,
  Thermometer,
  Droplet,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Cpu,
} from 'lucide-vue-next'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const generatorsStore = useGeneratorsStore()
const { generators } = storeToRefs(generatorsStore)

const alerts = ref<Leitura[]>([])
const isLoading = ref(false)
const hasError = ref(false)

const fetchAlerts = async () => {
  isLoading.value = true
  hasError.value = false
  try {
    if (generators.value.length === 0) {
      await generatorsStore.fetchGenerators()
    }
    const data = await getCriticalReadings(supabase, { limit: 50 })
    alerts.value = data
  } catch (error) {
    console.error('Erro ao buscar leituras críticas:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

// Recarrega os dados quando o dialog é aberto
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      fetchAlerts()
    }
  },
)

const getGeneratorName = (generatorId: string) => {
  const gen = generators.value.find((g) => g.id === generatorId)
  return gen?.name || 'Gerador Desconhecido'
}

const formatDateTime = (timestampStr: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestampStr))
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent
      class="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[85vh] flex flex-col p-6 overflow-hidden"
    >
      <!-- Cabeçalho -->
      <DialogHeader class="pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <DialogTitle class="text-xl font-bold"> Avisos Críticos de Operação </DialogTitle>
            <DialogDescription class="text-gray-600 dark:text-slate-400">
              Configure ou visualize as anormalidades detectadas nos geradores do sistema.
            </DialogDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            class="h-9 w-9 shrink-0"
            :disabled="isLoading"
            @click="fetchAlerts"
            title="Atualizar leituras"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </Button>
        </div>
      </DialogHeader>

      <!-- Conteúdo principal -->
      <div class="flex-1 overflow-y-auto py-4 min-h-75">
        <!-- Estado de Carregamento -->
        <div v-if="isLoading && alerts.length === 0" class="space-y-3 pr-2">
          <div
            v-for="n in 3"
            :key="n"
            class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3"
          >
            <div class="flex justify-between items-center">
              <Skeleton class="h-4 w-1/3 bg-slate-100 dark:bg-slate-800" />
              <Skeleton class="h-4 w-1/4 bg-slate-100 dark:bg-slate-800" />
            </div>
            <Skeleton class="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>

        <!-- Estado de Erro -->
        <div
          v-else-if="hasError"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl mb-4 text-red-500">
            <AlertTriangle class="w-8 h-8" />
          </div>
          <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-1 text-base">
            Erro ao carregar dados
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            Não foi possível recuperar os alertas do banco de dados. Verifique sua conexão.
          </p>
          <Button variant="default" @click="fetchAlerts">Tentar Novamente</Button>
        </div>

        <!-- Estado Vazio -->
        <div
          v-else-if="alerts.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <div class="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-full mb-4 text-emerald-500">
            <ShieldCheck class="w-8 h-8" />
          </div>
          <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
            Sistema Operando Normalmente
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Nenhuma anormalidade detectada nos geradores sob monitoramento. Todos os parâmetros
            operam dentro dos limites normais.
          </p>
        </div>

        <!-- Lista de Alertas -->
        <div v-else class="space-y-3 pr-2">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
          >
            <!-- Header do Item: Nome do Gerador + Data -->
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="font-bold text-sm text-slate-800 dark:text-slate-200 block truncate">
                  {{ getGeneratorName(alert.gerador_id as string) }}
                </span>
                <span
                  class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5"
                >
                  <Cpu class="w-3 h-3 shrink-0" />
                  ID do ESP32: {{ alert.gerador_id?.split('-')[0] }}...
                </span>
              </div>
              <div
                class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-medium bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800/80"
              >
                <Calendar class="w-3 h-3" />
                <span>{{ formatDateTime(alert.timestamp as string) }}</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 pt-0.5">
              <!-- Temperatura Crítica -->
              <div
                v-if="alert.temperatura !== null"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                :class="[
                  alert.temperatura >= TEMP_CRITICA
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950/30'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent',
                ]"
              >
                <Thermometer class="w-3.5 h-3.5 shrink-0" />
                <span>Temp: {{ alert.temperatura.toFixed(1) }}°C</span>
                <span
                  v-if="alert.temperatura >= TEMP_CRITICA"
                  class="text-[9px] uppercase font-bold tracking-wider opacity-90"
                >
                  (≥ {{ TEMP_CRITICA }}°C)
                </span>
              </div>

              <!-- Nível de Água Crítico -->
              <div
                v-if="alert.nivel_agua !== null"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                :class="[
                  alert.nivel_agua <= NIVEL_AGUA_CRITICO
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950/30'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent',
                ]"
              >
                <Droplet class="w-3.5 h-3.5 shrink-0" />
                <span>Nível Água: {{ alert.nivel_agua.toFixed(1) }}%</span>
                <span
                  v-if="alert.nivel_agua <= NIVEL_AGUA_CRITICO"
                  class="text-[9px] uppercase font-bold tracking-wider opacity-90"
                >
                  (≤ {{ NIVEL_AGUA_CRITICO }}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodapé -->
      <DialogFooter class="pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <DialogClose as-child>
          <Button
            variant="outline"
            class="w-full sm:w-auto font-medium"
            @click="emit('update:open', false)"
          >
            Fechar Painel
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
