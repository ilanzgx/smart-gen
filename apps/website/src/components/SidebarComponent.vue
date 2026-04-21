<script setup lang="ts">
import IconHouse from '@/components/icons/IconHouse.vue'
import IconZap from '@/components/icons/IconZap.vue'
import IconBell from '@/components/icons/IconBell.vue'
import IconSettings from '@/components/icons/IconSettings.vue'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconHouse, marginBottom: 'mb-0' },
  { to: '/geradores', label: 'Geradores', icon: IconZap, marginBottom: 'mb-6' },
  { to: '/alertas', label: 'Alertas', icon: IconBell, marginBottom: 'mb-0' },
]
// OBS: Algumas dessas rotas são bem provaveis que se transformarão em modal
</script>

<template>
  <aside
    class="w-64 border-r shrink-0 bg-white h-full shadow-2xl md:shadow-none z-50 flex flex-col"
  >
    <div class="flex flex-col h-full p-4 overflow-y-auto w-full">
      <!-- Logo -->
      <div class="mb-8 px-2">
        <RouterLink to="/dashboard">
          <h1 class="text-2xl font-bold text-gray-800">⚡ Smart Gen</h1>
        </RouterLink>
      </div>

      <!-- Nav principal -->
      <nav class="flex-1 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full"
          active-class="bg-sky-100 !text-gray-900"
          :class="item.marginBottom"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-semibold">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Configurações -->
      <div class="border-t pt-3">
        <RouterLink
          to="/configuracoes"
          class="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 w-full"
          active-class="bg-gray-100 !text-gray-900"
        >
          <IconSettings class="w-5 h-5 shrink-0 text-gray-600" />
          <span class="text-gray-900 font-medium">Configurações</span>
        </RouterLink>
      </div>
    </div>
  </aside>
</template>
