<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { supabase } from '@/lib/supabase'
import { getLastReadingByGeneratorId, type Leitura } from '@smart-gen/supabase'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'
import GeneratorCard from '@/components/GeneratorCard.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useGeneratorsStore } from '@/stores/generators.store'
import { Zap } from 'lucide-vue-next'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const generatorsStore = useGeneratorsStore()
const { generators } = storeToRefs(generatorsStore)

const name = computed(() => user.value?.user_metadata?.name)

const isLoading = ref(true)
const lastReadings = ref<Record<string, Leitura | null>>({})

const fetchAllLastReadings = async () => {
  const entries = await Promise.all(
    generators.value.map(async (generator) => {
      try {
        const reading = await getLastReadingByGeneratorId(supabase, generator.id)
        return [generator.id, reading] as const
      } catch {
        return [generator.id, null] as const
      }
    }),
  )
  lastReadings.value = Object.fromEntries(entries)
}

onMounted(async () => {
  await generatorsStore.fetchGenerators()
  await fetchAllLastReadings()
  isLoading.value = false
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
          Geradores
        </h1>
        <p class="text-sm text-slate-500 font-medium">
          Olá {{ name }}, você tem acesso a {{ generators.length }} gerador{{
            generators.length !== 1 ? 'es' : ''
          }}
          registrado{{ generators.length !== 1 ? 's' : '' }}.
        </p>
      </header>

      <!-- Skeleton Loading -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 overflow-hidden animate-pulse"
        >
          <!-- Header skeleton -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="space-y-1.5">
                <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div class="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div class="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>

          <!-- Metrics skeleton -->
          <div class="grid grid-cols-2 gap-3">
            <div class="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div class="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>

          <!-- Footer skeleton -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div class="h-3.5 w-36 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div
        v-else-if="generators.length === 0"
        class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center"
      >
        <div class="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl mb-4">
          <Zap class="w-6 h-6 text-amber-500" />
        </div>
        <h3 class="font-semibold text-base text-slate-800 dark:text-slate-100 mb-1">
          Nenhum gerador registrado
        </h3>
        <p class="text-sm text-slate-400 max-w-sm">
          Registre seu primeiro gerador pelo menu lateral para começar a monitorar seus
          equipamentos.
        </p>
      </div>

      <!-- Grid de geradores -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GeneratorCard
          v-for="generator in generators"
          :key="generator.id"
          :generator="generator"
          :last-reading="lastReadings[generator.id]"
        />
      </div>
    </div>
  </DashboardLayout>
</template>
