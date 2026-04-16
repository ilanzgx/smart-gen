<script setup lang="ts">
import { type ApexOptions, type ApexAxisChartSeries } from 'apexcharts'
import VueApexCharts from 'vue3-apexcharts'
import { onMounted, ref } from 'vue'
import { getReadingsByGeneratorId } from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps({
  generatorId: {
    type: String,
    required: true,
  },
})

const chartOptions: ApexOptions = {
  chart: {
    type: 'area',
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  stroke: {
    curve: 'smooth',
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [20, 100, 100, 100],
    },
  },
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    title: {
      text: 'Nível de Água (%)',
    },
    min: 0,
    max: 100,
    labels: {
      formatter: (value) => {
        return value.toFixed(0) + '%'
      },
    },
  },
  colors: ['#3b82f6'],
  tooltip: {
    x: {
      format: 'dd MMM HH:mm',
    },
  },
}

const loading = ref(true)

const series = ref<ApexAxisChartSeries>([
  {
    name: 'Nível de Água',
    data: [] as { x: number; y: number }[],
  },
])

async function fetchGeneratorReadings() {
  try {
    const readings = await getReadingsByGeneratorId(supabase, props.generatorId)
    return readings
  } catch (error) {
    console.error('Erro ao buscar leituras de água:', error)
    return []
  }
}

onMounted(async () => {
  const readings = await fetchGeneratorReadings()

  series.value = [
    {
      name: 'Nível de Água',
      data: readings.map((reading) => ({
        x: new Date(reading.timestamp!).getTime(),
        y: reading.nivel_agua || 0,
      })),
    },
  ]

  loading.value = false
})
</script>

<template>
  <div class="w-full relative min-h-75">
    <div v-if="loading" class="space-y-3">
      <Skeleton class="w-full h-75 rounded-lg" />
    </div>

    <VueApexCharts v-else width="100%" height="300" :options="chartOptions" :series="series" />
  </div>
</template>
