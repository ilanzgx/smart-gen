<script setup lang="ts">
import { ref } from 'vue'
import { House, Zap, Plus, Bell, Settings, FileDown } from 'lucide-vue-next'

import CreateGeneratorDialog from '@/components/dialogs/CreateGeneratorDialog.vue'
import SettingsDialog from '@/components/dialogs/SettingsDialog.vue'
import GenerateReportDialog from '@/components/dialogs/GenerateReportDialog.vue'

// Dialogs
const createGeneratorDialogOpen = ref(false)
const settingsDialogOpen = ref(false)
const generateReportDialogOpen = ref(false)
</script>

<template>
  <aside
    class="w-64 border-r shrink-0 bg-white h-full shadow-2xl md:shadow-none z-50 flex flex-col"
  >
    <div class="flex flex-col h-full p-4 overflow-y-auto w-full">
      <!-- Logo -->
      <div class="mb-8 px-2">
        <RouterLink to="/dashboard">
          <img class="md:w-full" src="/images/logo.webp" alt="Logo" />
        </RouterLink>
      </div>

      <!-- Nav principal -->
      <nav class="flex-1 space-y-1">
        <!-- Dashboard -->
        <RouterLink
          to="/dashboard"
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full mb-0"
          active-class="bg-sky-100 !text-gray-900"
        >
          <House class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-semibold">Dashboard</span>
        </RouterLink>

        <!-- Geradores -->
        <RouterLink
          to="/geradores"
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full mb-6"
          active-class="bg-sky-100 !text-gray-900"
        >
          <Zap class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-semibold">Geradores</span>
        </RouterLink>

        <!-- Registrar Gerador -->
        <button
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full cursor-pointer"
          active-class="bg-sky-100 !text-gray-900"
          @click="createGeneratorDialogOpen = true"
        >
          <Plus class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-semibold">Registrar Gerador</span>
        </button>
        <CreateGeneratorDialog v-model:open="createGeneratorDialogOpen" />

        <!-- Gerar Relatório -->
        <button
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full mb-6 cursor-pointer"
          active-class="bg-sky-100 !text-gray-900"
          @click="generateReportDialogOpen = true"
        >
          <FileDown class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-semibold">Gerar Relatório</span>
        </button>
        <GenerateReportDialog v-model:open="generateReportDialogOpen" />

        <!-- Alertas -->
        <RouterLink
          to="/alertas"
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full mb-0"
          active-class="bg-sky-100 !text-gray-900"
        >
          <Bell class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-semibold">Alertas</span>
        </RouterLink>
      </nav>

      <!-- Configurações -->
      <div class="border-t pt-3">
        <button
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full cursor-pointer"
          active-class="bg-gray-100 !text-gray-900"
          @click="settingsDialogOpen = true"
        >
          <Settings class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-medium">Configurações</span>
        </button>
        <SettingsDialog v-model:open="settingsDialogOpen" />
      </div>
    </div>
  </aside>
</template>
