<script setup lang="ts">
import { RouterLink } from 'vue-router'
import WaterGauge from '@/components/WaterGauge.vue'
import ThermometerGauge from '@/components/ThermometerGauge.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2"
      >
        <RouterLink to="/" aria-label="Ir para a página inicial" class="shrink-0">
          <img class="h-8 w-auto" src="/images/logo.webp" alt="Logo Smart Gen" />
        </RouterLink>

        <nav
          aria-label="Navegação Principal"
          class="flex items-center gap-2 sm:gap-3"
        >
          <RouterLink
            to="/login"
            class="px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 transition-all active:scale-95 text-center whitespace-nowrap"
          >
            Entrar
          </RouterLink>
          <RouterLink
            to="/register"
            class="px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-all active:scale-95 text-center whitespace-nowrap"
          >
            Criar Conta
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Left: Text + CTA -->
        <div>
          <h1
            class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6"
          >
            Monitoramento de geradores em tempo real
          </h1>
          <p class="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
            Sensores IoT no seu gerador transmitem temperatura e nível de água para a nuvem.
            Acompanhe tudo pelo dashboard — sem planilhas, sem visitas presenciais.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <RouterLink
              to="/register"
              class="px-8 py-4 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-all active:scale-95 text-center shadow-lg shadow-orange-600/20"
            >
              Começar agora
            </RouterLink>
            <RouterLink
              to="/contato"
              class="px-8 py-4 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-center"
            >
              Entrar em Contato
            </RouterLink>
          </div>
        </div>

        <!-- Right: Gauges -->
        <div class="flex justify-center lg:justify-end">
          <div class="grid grid-cols-2 gap-6 max-w-sm w-full">
            <div
              class="border border-slate-100 rounded-3xl p-6 flex flex-col items-center gap-2 bg-white shadow-sm"
            >
              <span class="text-sm font-semibold text-slate-500">Nível de água</span>
              <WaterGauge :value="50" class="w-24 h-24" />
              <p class="text-xs font-medium text-slate-400">Arrefecimento</p>
            </div>
            <div
              class="border border-slate-100 rounded-3xl p-6 flex flex-col items-center gap-2 bg-white shadow-sm"
            >
              <span class="text-sm font-semibold text-slate-500">Temperatura</span>
              <ThermometerGauge :value="50" class="w-24 h-24" />
              <p class="text-xs font-medium text-slate-400">Superaquecimento</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
