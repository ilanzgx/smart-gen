<script setup lang="ts">
import { supabase } from '@/lib/supabase'
import { getUser } from '@smart-gen/supabase'
import { onMounted, ref } from 'vue'
import TemperatureChart from '@/components/generators/TemperatureChart.vue'
import WaterLevelChart from '@/components/generators/WaterLevelChart.vue'
import HeaderComponent from '@/components/HeaderComponent.vue'

const name = ref<string | null>(null)

const defaultGeneratorId = ref('11111111-1111-1111-1111-111111111111')

onMounted(async () => {
  const userResponse = await getUser(supabase)
  name.value = userResponse.user_metadata?.name || userResponse.email
})
</script>

<template>
  <HeaderComponent />
  <main class="flex min-h-screen items-center justify-center p-4 mx-8">
    <div class="w-full space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-bold tracking-tight">👋 Olá, {{ name }}</h1>
      </div>

      <div class="mt-8">
        <p class="text-muted-foreground text-xs">Dados do Gerador: {{ defaultGeneratorId }}</p>
        <div class="flex justify-center items-center border-t pt-6">
          <div class="w-1/2 pr-2">
            <TemperatureChart :generator-id="defaultGeneratorId" />
          </div>
          <div class="w-1/2 pl-2">
            <WaterLevelChart :generator-id="defaultGeneratorId" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
