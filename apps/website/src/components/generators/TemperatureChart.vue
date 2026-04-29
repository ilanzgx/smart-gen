<script setup lang="ts">
import { type ApexOptions, type ApexAxisChartSeries } from 'apexcharts'
import VueApexCharts from 'vue3-apexcharts'
import { onMounted, ref } from 'vue'
import { getReadingsByGeneratorId } from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{
  generatorId: string
}>()
const loading = ref(true)
const isEmpty = ref(false)

const series = ref<ApexAxisChartSeries>([
  {
    name: 'Temperatura',
    data: [] as { x: number; y: number }[],
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
      opacityFrom: 0.4,
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
    max: 120,
    title: { text: '°C' },
    labels: {
      formatter: (v) => `${v.toFixed(0)}°C`,
    },
  },
  tooltip: {
    x: { format: 'dd MMM, HH:mm' },
    y: { formatter: (v) => `${v.toFixed(1)} °C` },
  },
  colors: ['#ef4444'],
  grid: {
    borderColor: '#f1f5f9',
  },
}

onMounted(async () => {
  try {
    const readings = await getReadingsByGeneratorId(supabase, props.generatorId)

    if (!readings.length) {
      isEmpty.value = true
      return
    }

    const sortedReadings = [...readings].sort(
      (a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime(),
    )

    series.value = [
      {
        name: 'Temperatura',
        data: sortedReadings
          .filter((r) => r.timestamp != null)
          .map((r) => ({
            x: new Date(r.timestamp!).getTime(),
            y: r.temperatura || 0,
          })),
      },
    ]
  } catch (error) {
    console.error('Erro ao buscar leituras de temperatura:', error)
    isEmpty.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="w-full relative min-h-75">
    <Skeleton v-if="loading" class="w-full h-75 rounded-lg" />

    <div v-else-if="isEmpty" class="flex items-center justify-center h-75 text-slate-400 text-sm">
      Sem dados de temperatura para exibir.
    </div>

    <VueApexCharts v-else width="100%" height="300" :options="chartOptions" :series="series" />
  </div>
</template>
