<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { supabase } from '@/lib/supabase'
import {
  getLastReadingByGeneratorId,
  subscribeToGeneratorReadings,
  type Leitura,
} from '@smart-gen/supabase'
import TemperatureChart from '@/components/generators/TemperatureChart.vue'
import WaterLevelChart from '@/components/generators/WaterLevelChart.vue'
import WaterGauge from '@/components/WaterGauge.vue'
import ThermometerGauge from '@/components/ThermometerGauge.vue'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useGeneratorsStore } from '@/stores/generators.store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { Activity, Droplets, ThermometerSun, ArrowUp, ArrowDown, Minus } from 'lucide-vue-next'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const generatorsStore = useGeneratorsStore()
const { generators, selectedGeneratorId, selectedGenerator } = storeToRefs(generatorsStore)

const name = computed(() => user.value?.user_metadata?.name)

const lastWaterLevel = ref(0)
const lastTemperature = ref(0)
const lastTimestamp = ref<string | null>(null)
const lastReadingForCharts = ref<Leitura | null>(null)
const isOperating = ref(false)
const isSwitchingChannel = ref(true)

const waterLevelDelta = ref<number | null>(null)
const temperatureDelta = ref<number | null>(null)

const isUpdatingData = ref(false)
let updateTimer: ReturnType<typeof setTimeout> | null = null

let unsubscribeRealtime: (() => Promise<void>) | null = null

const setupRealtime = () => {
  if (unsubscribeRealtime) {
    unsubscribeRealtime()
    unsubscribeRealtime = null
  }

  if (!selectedGeneratorId.value) return

  // Cria nova inscrição imediatamente — cada canal usa um nome único,
  // então não há risco de colisão com o canal anterior em estado LEAVING
  const { unsubscribe } = subscribeToGeneratorReadings(
    supabase,
    selectedGeneratorId.value,
    (payload) => {
      console.log('[Dashboard] Nova leitura recebida via Realtime:', payload.new)
      updateDashboardFromReading(payload.new)
    },
    // Refaz fetch quando reconecta (dados podem estar desatualizados)
    () => {
      console.log('[Dashboard] Canal reconectado, atualizando dados...')
      fetchDashboardData()
    },
    // Callback de conexão inicial
    (success) => {
      if (!success) {
        console.warn('[Dashboard] Falha ao conectar no canal realtime.')
      }
      isSwitchingChannel.value = false
    },
  )
  unsubscribeRealtime = unsubscribe
}

const updateDashboardFromReading = (reading: {
  nivel_agua: number | null
  temperatura: number | null
  timestamp: string | null
}) => {
  // Só atualiza se leitura for diferente da atual
  if (reading.timestamp === lastTimestamp.value) return

  if (lastTimestamp.value && reading.timestamp) {
    if (reading.nivel_agua !== null && lastWaterLevel.value !== null) {
      waterLevelDelta.value = reading.nivel_agua - lastWaterLevel.value
    }
    if (reading.temperatura !== null && lastTemperature.value !== null) {
      temperatureDelta.value = reading.temperatura - lastTemperature.value
    }
  }

  lastWaterLevel.value = reading.nivel_agua ?? 0
  lastTemperature.value = reading.temperatura ?? 0
  lastTimestamp.value = reading.timestamp ?? null
  lastReadingForCharts.value = reading as Leitura

  isUpdatingData.value = true
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    isUpdatingData.value = false
  }, 500)

  if (reading.timestamp) {
    const readingTime = new Date(reading.timestamp).getTime()
    const now = Date.now()
    const thirtyMinutesInMilliseconds = 30 * 60 * 1000
    isOperating.value = now - readingTime <= thirtyMinutesInMilliseconds
  } else {
    isOperating.value = false
  }
}

const fetchDashboardData = async () => {
  if (!selectedGeneratorId.value) return

  const lastReading = await getLastReadingByGeneratorId(supabase, selectedGeneratorId.value)

  // Só atualiza se leitura for diferente da atual
  if (lastReading?.timestamp === lastTimestamp.value) return

  waterLevelDelta.value = null
  temperatureDelta.value = null

  lastWaterLevel.value = lastReading?.nivel_agua ?? 0
  lastTemperature.value = lastReading?.temperatura ?? 0
  lastTimestamp.value = lastReading?.timestamp ?? null
  lastReadingForCharts.value = lastReading as Leitura

  /*
   * Lógica do status de operação:
   * Se não houver uma leitura nos ultimos 30 minutos, o gerador está parado.
   * Se houver uma leitura nos ultimos 30 minutos, o gerador está operando.
   */
  if (lastReading?.timestamp) {
    const readingTime = new Date(lastReading.timestamp).getTime()
    const now = Date.now()
    const thirtyMinutesInMilliseconds = 30 * 60 * 1000

    isOperating.value = now - readingTime <= thirtyMinutesInMilliseconds
  } else {
    isOperating.value = false
  }
}

// Isso é chamado sempre quando o valor de selectedGeneratorId mudar
// Fazendo o fetch + realtime do gerador selecionado em especifico
watch(
  () => selectedGeneratorId.value,
  async (newId, oldId) => {
    if (newId === oldId) return
    if (!newId) {
      return
    }

    isSwitchingChannel.value = true
    await fetchDashboardData()
    setupRealtime()
  },
  { immediate: true },
)

onMounted(async () => {
  await generatorsStore.fetchGenerators()
})

onUnmounted(() => {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  if (unsubscribeRealtime) {
    unsubscribeRealtime()
  }
})

const formattedLastSync = computed(() => {
  if (!lastTimestamp.value) return 'Aguardando dados...'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(lastTimestamp.value))
})
</script>

<template>
  <DashboardLayout>
    <div class="w-full max-w-8xl mx-auto space-y-4 md:space-y-5 pb-6">
      <!-- Cabeçalho -->
      <header class="mt-2 md:mt-1 space-y-1.5">
        <h1
          class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Olá, {{ name }}
        </h1>
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-500 font-medium"
        >
          <span>Gerenciando unidade</span>
          <Select v-model="selectedGeneratorId" :disabled="isSwitchingChannel">
            <SelectTrigger class="w-full sm:w-auto sm:min-w-70 bg-gray-100">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="generator in generators" :key="generator.id" :value="generator.id">
                {{ generator.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <!-- Grid de indicadores -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <template v-if="isSwitchingChannel">
          <!-- Skeleton: Card de status -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden animate-pulse min-h-37"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div class="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div class="flex items-end gap-3 mt-auto pt-4">
              <div class="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-1.5"></div>
              <div class="space-y-2.5 flex-1">
                <div class="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div class="h-3.5 w-52 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Skeleton: Card de temperatura -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex items-center justify-between overflow-hidden animate-pulse min-h-37"
          >
            <div class="flex flex-col justify-between pb-2 flex-1">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div class="space-y-2.5 mt-auto">
                <div class="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div class="h-3.5 w-36 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div class="w-20 h-28 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 ml-4"></div>
          </div>

          <!-- Skeleton: Card de nível de água -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex items-center justify-between overflow-hidden animate-pulse min-h-37"
          >
            <div class="flex flex-col justify-between pb-2 flex-1">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div class="space-y-2.5 mt-auto">
                <div class="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div class="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div class="w-24 h-28 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 ml-4"></div>
          </div>
        </template>

        <template v-else>
          <!-- Card de status de operação -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden"
          >
            <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
              <div
                class="p-1.5 rounded-lg"
                :class="
                  isOperating
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'bg-red-50 dark:bg-red-500/10'
                "
              >
                <Activity
                  class="w-4 h-4"
                  :class="isOperating ? 'text-emerald-500' : 'text-red-500'"
                />
              </div>
              <h3 class="font-medium text-sm">Estado atual do gerador</h3>
            </div>

            <div class="flex items-end gap-3 mt-auto pt-4">
              <div class="relative flex h-3.5 w-3.5 mb-1.5">
                <span
                  v-if="isOperating"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-3.5 w-3.5"
                  :class="isOperating ? 'bg-emerald-500' : 'bg-red-500'"
                ></span>
              </div>
              <div>
                <span class="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {{ isOperating ? 'Operando' : 'Parado' }}
                </span>
                <p class="text-xs text-slate-400 font-medium mt-1">
                  Ultima leitura: {{ formattedLastSync }}
                </p>
              </div>
            </div>
          </div>

          <!-- Card de temperatura -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex items-center justify-between overflow-hidden"
          >
            <div class="flex flex-col h-full justify-between pb-2">
              <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
                <div class="p-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg">
                  <ThermometerSun class="w-4 h-4 text-red-500" />
                </div>
                <h3 class="font-medium text-sm">Temperatura</h3>
              </div>
              <div class="mt-auto">
                <span
                  class="text-3xl font-bold tracking-tight flex items-center transition-colors duration-500"
                  :class="
                    isUpdatingData && temperatureDelta !== null
                      ? temperatureDelta > 0
                        ? 'text-emerald-500'
                        : temperatureDelta < 0
                          ? 'text-red-500'
                          : 'text-slate-400'
                      : 'text-slate-800 dark:text-slate-100'
                  "
                >
                  {{ lastTemperature.toFixed(1)
                  }}<span class="text-lg text-slate-400 font-semibold ml-1">°C</span>
                  <span
                    v-if="temperatureDelta !== null"
                    class="ml-3 text-sm font-medium flex items-center"
                    :class="
                      temperatureDelta > 0
                        ? 'text-emerald-500'
                        : temperatureDelta < 0
                          ? 'text-red-500'
                          : 'text-slate-400'
                    "
                  >
                    <ArrowUp v-if="temperatureDelta > 0" class="w-4 h-4 mr-0.5" />
                    <ArrowDown v-else-if="temperatureDelta < 0" class="w-4 h-4 mr-0.5" />
                    <Minus v-else class="w-4 h-4 mr-0.5" />
                    {{ Math.abs(temperatureDelta).toFixed(1) }}
                  </span>
                </span>
                <p class="text-xs text-slate-400 font-medium mt-1">Temperatura do gerador</p>
              </div>
            </div>
            <div class="w-20 shrink-0 -my-2 flex items-center justify-center">
              <ThermometerGauge :value="lastTemperature" />
            </div>
          </div>

          <!-- Card de nível de água -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex flex-row items-center justify-between overflow-hidden"
          >
            <div class="flex flex-col h-full justify-between pb-2">
              <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
                <div class="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                  <Droplets class="w-4 h-4 text-blue-500" />
                </div>
                <h3 class="font-medium text-sm">Nível de água</h3>
              </div>
              <div class="mt-auto">
                <span
                  class="text-3xl font-bold tracking-tight flex items-center transition-colors duration-500"
                  :class="
                    isUpdatingData && waterLevelDelta !== null
                      ? waterLevelDelta > 0
                        ? 'text-emerald-500'
                        : waterLevelDelta < 0
                          ? 'text-red-500'
                          : 'text-slate-400'
                      : 'text-slate-800 dark:text-slate-100'
                  "
                >
                  {{ lastWaterLevel.toFixed(1)
                  }}<span class="text-lg text-slate-400 font-semibold ml-1">%</span>
                  <span
                    v-if="waterLevelDelta !== null"
                    class="ml-3 text-sm font-medium flex items-center"
                    :class="
                      waterLevelDelta > 0
                        ? 'text-emerald-500'
                        : waterLevelDelta < 0
                          ? 'text-red-500'
                          : 'text-slate-400'
                    "
                  >
                    <ArrowUp v-if="waterLevelDelta > 0" class="w-4 h-4 mr-0.5" />
                    <ArrowDown v-else-if="waterLevelDelta < 0" class="w-4 h-4 mr-0.5" />
                    <Minus v-else class="w-4 h-4 mr-0.5" />
                    {{ Math.abs(waterLevelDelta).toFixed(1) }}
                  </span>
                </span>
                <p class="text-xs text-slate-400 font-medium mt-1">Volume de água</p>
              </div>
            </div>
            <div class="w-24 shrink-0 flex items-center justify-center -mr-2.5">
              <WaterGauge :value="lastWaterLevel" />
            </div>
          </div>
        </template>
      </div>

      <!-- Grid de gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <template v-if="isSwitchingChannel">
          <!-- Skeleton: Gráfico de temperatura -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 overflow-hidden animate-pulse"
          >
            <div class="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div class="h-52 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
          </div>

          <!-- Skeleton: Gráfico de nível de água -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 overflow-hidden animate-pulse"
          >
            <div class="h-5 w-52 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div class="h-52 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </template>

        <template v-else>
          <!-- Card de gráfico de temperatura -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 overflow-hidden"
          >
            <h3
              class="font-semibold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"
            >
              Histórico de temperatura
            </h3>
            <TemperatureChart
              v-if="selectedGenerator"
              :key="selectedGenerator.id"
              :generator-id="selectedGenerator.id"
              :last-reading="lastReadingForCharts"
            />
          </div>

          <!-- Card de gráfico de nível de água -->
          <div
            class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 overflow-hidden"
          >
            <h3 class="font-semibold text-base text-slate-800 dark:text-slate-100 mb-4">
              Histórico de nível de água
            </h3>
            <WaterLevelChart
              v-if="selectedGenerator"
              :key="selectedGenerator.id"
              :generator-id="selectedGenerator.id"
              :last-reading="lastReadingForCharts"
            />
          </div>
        </template>
      </div>
    </div>
  </DashboardLayout>
</template>
