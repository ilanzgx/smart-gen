<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui'
import { MapPinOff } from 'lucide-vue-next'
</script>

<template>
  <main
    class="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-8"
  >
    <div class="text-center max-w-md w-full flex flex-col items-center">
      <h1 class="text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
        404
      </h1>

      <h2 class="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mb-2">
        Página não encontrada
      </h2>

      <p class="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        Oops! A página que você está procurando pode ter sido removida, mudado de nome ou está
        temporariamente indisponível.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 w-full justify-center">
        <RouterLink to="/" class="w-full sm:w-auto">
          <Button variant="default" class="w-full sm:w-auto font-semibold">
            Voltar para o Início
          </Button>
        </RouterLink>
        <Button variant="outline" class="w-full sm:w-auto font-semibold" @click="$router.back()">
          Página Anterior
        </Button>
      </div>
    </div>
  </main>
</template>
