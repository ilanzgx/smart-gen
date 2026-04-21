<script setup lang="ts">
import { supabase } from '@/lib/supabase'
import { getUser } from '@smart-gen/supabase'
import { onMounted, ref } from 'vue'
import TemperatureChart from '@/components/generators/TemperatureChart.vue'
import WaterLevelChart from '@/components/generators/WaterLevelChart.vue'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'

const name = ref<string | null>(null)

const defaultGeneratorId = ref('11111111-1111-1111-1111-111111111111')

onMounted(async () => {
  const userResponse = await getUser(supabase)
  name.value = userResponse.user_metadata?.name || userResponse.email
})
</script>

<template>
  <DashboardLayout>
    <div class="w-full space-y-6 md:space-y-8">
      <!-- Alinhamento adaptativo (Mobile friendly) -->
      <div class="space-y-2 text-center sm:text-left mt-2 md:mt-6">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">👋 Olá, {{ name }}</h1>
      </div>

      <div class="mt-6 md:mt-8">
        <p class="text-muted-foreground text-xs md:text-sm mb-4">
          Dados do Gerador: <span class="font-mono">{{ defaultGeneratorId }}</span>
        </p>

        <!-- Grid Responsivo (Mobile friendly) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-6">
          <div class="w-full">
            <TemperatureChart :generator-id="defaultGeneratorId" />
          </div>
          <div class="w-full">
            <WaterLevelChart :generator-id="defaultGeneratorId" />
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
