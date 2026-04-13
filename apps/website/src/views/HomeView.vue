<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="min-h-screen flex flex-col items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold">⚡ Smart Gen</h1>
      <p class="mt-2 text-lg text-gray-500">Monitoramento de geradores de energia</p>
    </div>
    
    <div class="mt-8 flex gap-4">
      <RouterLink to="/login" class="text-blue-600 hover:underline">
        Fazer Login
      </RouterLink>
      <RouterLink to="/register" class="text-blue-600 hover:underline">
        Criar Conta
      </RouterLink>
    </div>
  </main>
</template>
