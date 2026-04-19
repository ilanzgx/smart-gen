<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';
import Separator from './ui/separator/Separator.vue';
import Button from './ui/button/Button.vue';

function logout() {
  useAuthStore().signOut();
}
</script>

<template>
  <main>
    <div class="flex justify-between items-center pt-2 pr-2">
      <div class="flex gap-4">
        <h1 class="text-2xl font-bold text-gray-800">⚡ Smart Gen</h1>
        <p class="text-gray-500 mt-1">Monitoramento de geradores de energia</p>
      </div>

      <div class="flex items-center gap-4">
        <RouterLink to="/">
          <Button @click="logout" variant="outline">Sair</Button>
        </RouterLink>

        <img
          class="w-10 h-10 rounded-full shrink-0 object-cover border-2 border-gray-200"
          src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
          alt="User"
        />
      </div>
    </div>
    <Separator class="my-2"/>
  </main>
</template>
