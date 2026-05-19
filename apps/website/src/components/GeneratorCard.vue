<script setup lang="ts">
import { computed } from 'vue'
import type { Generator } from '@smart-gen/supabase'
import { Activity, Cpu, Calendar } from 'lucide-vue-next'

const props = defineProps<{
  generator: Generator
  lastReading?: {
    temperatura: number | null
    nivel_agua: number | null
    timestamp: string | null
  } | null
}>()

const isOperating = computed(() => {
  if (!props.lastReading?.timestamp) return false
  const readingTime = new Date(props.lastReading.timestamp).getTime()
  const now = Date.now()
  const thirtyMinutesInMilliseconds = 30 * 60 * 1000
  return now - readingTime <= thirtyMinutesInMilliseconds
})

const formattedDate = computed(() => {
  if (!props.generator.created_at) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(props.generator.created_at))
})

const formattedLastReading = computed(() => {
  if (!props.lastReading?.timestamp) return 'Sem leituras'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.lastReading.timestamp))
})
</script>

<template>
  <RouterLink
    :to="'/dashboard'"
    class="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group"
  >
    <!-- Header: Nome + Status -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="min-w-0">
          <h3
            class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
          >
            {{ generator.name || 'Sem nome' }}
          </h3>
          <p v-if="generator.description" class="text-xs text-slate-400 truncate mt-0.5">
            {{ generator.description }}
          </p>
        </div>
      </div>

      <!-- Status badge -->
      <div
        class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium shrink-0"
        :class="
          isOperating
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
        "
      >
        <div class="relative flex h-2 w-2">
          <span
            v-if="isOperating"
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
          ></span>
          <span
            class="relative inline-flex rounded-full h-2 w-2"
            :class="isOperating ? 'bg-emerald-500' : 'bg-red-500'"
          ></span>
        </div>
        {{ isOperating ? 'Operando' : 'Parado' }}
      </div>
    </div>

    <!-- Métricas -->
    <div class="grid grid-cols-2 gap-3">
      <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Activity class="w-3.5 h-3.5 shrink-0" />
        <span class="truncate">{{ formattedLastReading }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Cpu class="w-3.5 h-3.5 shrink-0" />
        <span class="truncate font-mono">{{ generator.esp32_id || '—' }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400"
    >
      <Calendar class="w-3.5 h-3.5 shrink-0" />
      <span>Registrado em {{ formattedDate }}</span>
    </div>
  </RouterLink>
</template>
