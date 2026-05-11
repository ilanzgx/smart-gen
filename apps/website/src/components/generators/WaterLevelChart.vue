<script setup lang="ts">
import { type ApexOptions, type ApexAxisChartSeries } from 'apexcharts'
import VueApexCharts from 'vue3-apexcharts'
import { onMounted, ref, computed, watch } from 'vue'
import { getReadingsByGeneratorId, type Leitura } from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{
  generatorId: string
  lastReading?: Leitura | null
}>()
const loading = ref(true)

const timeFilter = ref(1)
const allReadings = ref<Leitura[]>([])

const filterOptions = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '1a', value: 365 },
]

const filteredReadings = computed(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - timeFilter.value)
  return allReadings.value.filter(
    (r: Leitura) => new Date(r.timestamp!).getTime() >= cutoff.getTime(),
  )
})

const isEmpty = computed(() => filteredReadings.value.length === 0)

const series = computed<ApexAxisChartSeries>(() => [
  {
    name: 'Nível de água',
    data: filteredReadings.value.map((r) => ({
      x: new Date(r.timestamp!).getTime(),
      y: r.nivel_agua || 0,
    })),
  },
])

const chartOptions: ApexOptions = {
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.02,
      stops: [0, 100],
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    type: 'datetime',
    labels: {
      datetimeUTC: false,
      format: 'dd/MM HH:mm',
    },
  },
  yaxis: {
    min: 0,
    max: 100,
    title: { text: '%' },
    labels: {
      formatter: (v) => `${v.toFixed(0)}%`,
    },
  },
  tooltip: {
    x: { format: 'dd MMM, HH:mm' },
    y: { formatter: (v) => `${v.toFixed(1)}%` },
  },
  colors: ['#3b82f6'],
  grid: {
    borderColor: '#f1f5f9',
  },
}

onMounted(async () => {
  try {
    const readings = await getReadingsByGeneratorId(supabase, props.generatorId)

    allReadings.value = [...readings]
      .filter((r) => r.timestamp != null)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime())
  } catch (error) {
    console.error('Erro ao buscar leituras de água:', error)
  } finally {
    loading.value = false
  }
})

watch(
  () => props.lastReading,
  (newReading) => {
    if (newReading?.timestamp) {
      // console.log('[WaterLevelChart] Recebido via prop:', newReading)

      // Evita duplicatas verificando timestamp
      const exists = allReadings.value.some(
        (r) => r.timestamp === newReading.timestamp && r.nivel_agua === newReading.nivel_agua,
      )

      if (!exists) {
        allReadings.value.push(newReading)
        allReadings.value.sort(
          (a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime(),
        )
      }
    }
  },
  { immediate: false },
)
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap sm:flex-nowrap justify-start sm:justify-end gap-2 w-full">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        @click="timeFilter = opt.value"
        class="flex-1 sm:flex-none min-h-11 sm:min-h-9 px-4 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-semibold rounded-lg transition-all duration-200 ease-in-out active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
        :class="
          timeFilter === opt.value
            ? 'bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900'
            : 'bg-slate-200 text-slate-600  hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
        "
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="w-full relative min-h-75">
      <Skeleton v-if="loading" class="w-full h-75 rounded-lg" />

      <div v-else-if="isEmpty" class="flex items-center justify-center h-75 text-slate-400 text-sm">
        Sem dados de nível de água para exibir.
      </div>

      <VueApexCharts v-else width="100%" height="300" :options="chartOptions" :series="series" />
    </div>
  </div>
</template>
