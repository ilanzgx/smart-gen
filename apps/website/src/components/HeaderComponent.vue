<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import Separator from './ui/separator/Separator.vue'
import Button from './ui/button/Button.vue'

async function logout() {
  await useAuthStore().signOut()
}
</script>

<template>
  <main>
    <div class="flex justify-between items-center pt-2 pr-2">
      <div>
        <!-- espaço para breadcrumb futuro -->
      </div>

      <div class="flex items-center gap-4">
        <RouterLink to="/perfil">
          <img
            class="w-10 h-10 rounded-full shrink-0 object-cover border-2 border-gray-200"
            src="/images/user.svg"
            alt="User"
          />
        </RouterLink>
        <RouterLink to="/">
          <Button @click="logout" variant="outline">Sair</Button>
        </RouterLink>
      </div>
    </div>
    <Separator class="my-2" />
  </main>
</template>
