<script setup lang="ts">
import HeaderComponent from '@/components/HeaderComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
</script>

<template>
  <div class="min-h-screen flex">
    <SidebarComponent />

    <div class="flex flex-col flex-1 overflow-hidden">
      <HeaderComponent />

      <main class="flex-1 overflow-y-auto p-4 mx-8">
        <slot />
      </main>
    </div>
  </div>
</template>
