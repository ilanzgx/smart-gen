<script setup lang="ts">
import { ref } from 'vue'
import HeaderComponent from '@/components/HeaderComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'

const isSidebarOpen = ref(false)
</script>

<template>
  <div class="h-screen flex w-full bg-slate-50 dark:bg-slate-950">
    <!-- Sidebar no mobile é fixo, no desktop é relativo -->
    <SidebarComponent
      class="fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    />

    <!-- Overlay no mobile para fechar a sidebar -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
      @click="isSidebarOpen = false"
      aria-hidden="true"
    ></div>

    <div class="flex flex-col flex-1 overflow-hidden min-w-0">
      <!-- No desktop aparece o header, no mobile aparece o menu que emite evento para abrir a sidebar -->
      <HeaderComponent @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <!-- Conteúdo principal -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
