<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { supabase } from '@/lib/supabase'
import { getLastReadingByGeneratorId } from '@smart-gen/supabase'
import TemperatureChart from '@/components/generators/TemperatureChart.vue'
import WaterLevelChart from '@/components/generators/WaterLevelChart.vue'
import WaterGauge from '@/components/WaterGauge.vue'
import ThermometerGauge from '@/components/ThermometerGauge.vue'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { Activity, Droplets, ThermometerSun } from 'lucide-vue-next'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const name = computed(() => user.value?.user_metadata?.name)

/*
 * Geradores de exemplo:
 * 11111111-1111-1111-1111-111111111111 e 22222222-2222-2222-2222-222222222222
 */
const defaultGeneratorId = ref('22222222-2222-2222-2222-222222222222')
const lastWaterLevel = ref(0)
const lastTemperature = ref(0)
const lastTimestamp = ref<string | null>(null)
const isOperating = ref(false)

onMounted(async () => {
  const lastReading = await getLastReadingByGeneratorId(supabase, defaultGeneratorId.value)
  lastWaterLevel.value = lastReading?.nivel_agua ?? 0
  lastTemperature.value = lastReading?.temperatura ?? 0
  lastTimestamp.value = lastReading?.timestamp ?? null

  /*
   * Lógica do status de operação:
   * Se não houver uma leitura nas ultimas 1 horas, o gerador está parado.
   * Se houver uma leitura nas ultimas 1 horas, o gerador está operando.
   */
  if (lastReading?.timestamp) {
    const readingTime = new Date(lastReading.timestamp).getTime()
    const now = Date.now()
    const oneHourInMilliseconds = 60 * 60 * 1000

    isOperating.value = now - readingTime <= oneHourInMilliseconds
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
    <div class="w-full max-w-8xl mx-auto space-y-6 md:space-y-6 pb-8">
      <!-- Cabeçalho -->
      <header class="mt-2 md:mt-4 space-y-1.5">
        <h1
          class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          👋 Olá, {{ name }}
        </h1>
        <p class="text-sm text-slate-500 font-medium flex items-center gap-2">
          Gerenciando unidade
          <span
            class="font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border text-xs"
          >
            {{ defaultGeneratorId }}
          </span>
        </p>
      </header>

      <!-- Grid de indicadores -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card de status de operação -->
        <div
          class="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 flex flex-col justify-between overflow-hidden"
        >
          <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
            <div
              class="p-2 rounded-lg"
              :class="
                isOperating
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'bg-red-50 dark:bg-red-500/10'
              "
            >
              <Activity
                class="w-5 h-5"
                :class="isOperating ? 'text-emerald-500' : 'text-red-500'"
              />
            </div>
            <h3 class="font-medium text-sm">Estado atual do gerador</h3>
          </div>

          <div class="flex items-end gap-3 mt-auto pt-4">
            <div class="relative flex h-4 w-4 mb-1.5">
              <span
                v-if="isOperating"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-4 w-4"
                :class="isOperating ? 'bg-emerald-500' : 'bg-red-500'"
              ></span>
            </div>
            <div>
              <span class="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
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
          class="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 flex items-center justify-between overflow-hidden"
        >
          <div class="flex flex-col h-full justify-between pb-2">
            <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
              <div class="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                <ThermometerSun class="w-5 h-5 text-red-500" />
              </div>
              <h3 class="font-medium text-sm">Temperatura</h3>
            </div>
            <div class="mt-auto">
              <span class="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {{ lastTemperature
                }}<span class="text-xl text-slate-400 font-semibold ml-1">°C</span>
              </span>
              <p class="text-xs text-slate-400 font-medium mt-1">Temperatura do gerador</p>
            </div>
          </div>
          <div class="w-24 shrink-0 -my-2 flex items-center justify-center">
            <ThermometerGauge :value="lastTemperature" />
          </div>
        </div>

        <!-- Card de nível de água -->
        <div
          class="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 flex flex-row items-center justify-between overflow-hidden"
        >
          <div class="flex flex-col h-full justify-between pb-2">
            <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
              <div class="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Droplets class="w-5 h-5 text-blue-500" />
              </div>
              <h3 class="font-medium text-sm">Nível de água</h3>
            </div>
            <div class="mt-auto">
              <span class="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {{ lastWaterLevel }}<span class="text-xl text-slate-400 font-semibold ml-1">%</span>
              </span>
              <p class="text-xs text-slate-400 font-medium mt-1">Volume de água</p>
            </div>
          </div>
          <div class="w-28 shrink-0 flex items-center justify-center -mr-2.5">
            <WaterGauge :value="lastWaterLevel" />
          </div>
        </div>
      </div>

      <!-- Grid de gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <!-- Card de gráfico de temperatura -->
        <div class="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 overflow-hidden">
          <h3
            class="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"
          >
            Histórico de temperatura
          </h3>
          <TemperatureChart :generator-id="defaultGeneratorId" />
        </div>
        <!-- Card de gráfico de nível de água -->
        <div class="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 overflow-hidden">
          <h3 class="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-6">
            Histórico de nível de água
          </h3>
          <WaterLevelChart :generator-id="defaultGeneratorId" />
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
