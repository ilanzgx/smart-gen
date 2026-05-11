<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import Separator from './ui/separator/Separator.vue'
import Button from './ui/button/Button.vue'
import { Menu } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

// Criação de um evento para abrir a sidebar no mobile
// No desktop não acontece nada, uma vez que o hambúrguer não aparece
const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const { signOut } = useAuthStore()
const router = useRouter()

async function logout() {
  await signOut()

  router.push({ name: 'login' })
}
</script>

<template>
  <header>
    <div class="flex justify-between items-center px-4 md:px-6 py-3">
      <div class="flex items-center gap-3">
        <!-- Ícone Hambúrguer só aparece no Mobile, para invocar a Sidebar -->
        <button
          @click="emit('toggle-sidebar')"
          class="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Menu"
        >
          <Menu class="w-6 h-6" />
        </button>
        <!-- espaço para breadcrumb futuro -->
      </div>

      <div class="flex items-center gap-4">
        <RouterLink to="/perfil">
          <img
            class="w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0 object-cover border-2 border-gray-200"
            src="/images/user.svg"
            alt="User"
          />
        </RouterLink>
        <Button @click="logout" variant="outline" size="sm" class="hidden md:inline-flex"
          >Sair</Button
        >
        <Button
          @click="logout"
          variant="outline"
          size="sm"
          class="md:hidden inline-flex h-9 px-3 text-xs"
          >Sair</Button
        >
      </div>
    </div>
    <Separator class="mb-0" />
  </header>
</template>
