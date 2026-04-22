<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { supabase } from '@/lib/supabase'
import { getLastReadingByGeneratorId } from '@smart-gen/supabase'
import TemperatureChart from '@/components/generators/TemperatureChart.vue'
import WaterLevelChart from '@/components/generators/WaterLevelChart.vue'
import WaterGauge from '@/components/WaterGauge.vue'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const name = computed(() => user.value?.user_metadata?.name)

/*
 * Geradores de exemplo:
 * 11111111-1111-1111-1111-111111111111 e 22222222-2222-2222-2222-222222222222
 */
const defaultGeneratorId = ref('22222222-2222-2222-2222-222222222222')
const waterLevel = ref(0)

onMounted(async () => {
  const lastReading = await getLastReadingByGeneratorId(supabase, defaultGeneratorId.value)
  waterLevel.value = lastReading?.nivel_agua ?? 0
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
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t pt-6">
          <div class="w-full">
            <TemperatureChart :generator-id="defaultGeneratorId" />
          </div>
          <div class="w-full">
            <WaterLevelChart :generator-id="defaultGeneratorId" />
          </div>
          <div class="w-full flex items-center justify-center">
            <WaterGauge :value="waterLevel" />
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
