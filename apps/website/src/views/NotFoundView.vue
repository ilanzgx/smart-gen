<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <main class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl mb-4">⚠️ ERRO 404</h1>
      <h3 class="text-lg text-gray-500">Oops, parece que esta página não existe.</h3>
      <h3 class="text-lg text-gray-500">Talvez você tenha digitado a URL errada ou a página foi removida.</h3>
      <RouterLink to="/" class="text-blue-600 hover:underline mt-4 block">Voltar para a página inicial</RouterLink>
    </div>
  </main>
</template>
