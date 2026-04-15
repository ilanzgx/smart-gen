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
    type: 'line',
  },
  stroke: {
    curve: 'smooth',
  },
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    title: {
      text: 'Temperatura (°C)',
    },
    labels: {
      formatter: (value) => {
        return value.toFixed(1) + ' °C'
      },
    },
  },
  colors: ['#ef4444'],
}

const loading = ref(true)

const series = ref<ApexAxisChartSeries>([
  {
    name: 'Temperatura',
    data: [] as { x: number; y: number }[],
  },
])

async function fetchGeneratorReadings() {
  const readings = await getReadingsByGeneratorId(supabase, props.generatorId)
  return readings
}

onMounted(async () => {
  const readings = await fetchGeneratorReadings()

  series.value = [
    {
      name: 'Temperatura',
      data: readings.map((reading) => ({
        x: new Date(reading.timestamp!).getTime(),
        y: reading.temperatura || 0,
      })),
    },
  ]

  loading.value = false
})
</script>

<template>
  <div class="w-full relative min-h-75">
    <Skeleton v-if="loading" class="w-full h-75 rounded-lg" />

    <VueApexCharts v-else width="100%" height="300" :options="chartOptions" :series="series" />
  </div>
</template>
