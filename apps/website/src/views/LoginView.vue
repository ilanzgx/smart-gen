<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return

  try {
    await authStore.signIn({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (error) {
    console.error('Falha no login:', error)
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-bold tracking-tight">Entrar</h1>
        <p class="text-muted-foreground text-sm">
          Insira suas credenciais para acessar sua conta
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-2">
          <Label for="email">E-mail</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="m@exemplo.com"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="space-y-2">
          <Label for="password">Senha</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            required
            :disabled="authStore.loading"
          />
        </div>

        <p v-if="authStore.hasError" class="text-sm font-medium text-destructive">
          {{ authStore.error }}
        </p>

        <Button type="submit" class="w-full" :disabled="authStore.loading">
          <span v-if="authStore.loading">Entrando...</span>
          <span v-else>Entrar</span>
        </Button>
      </form>
    </div>
  </main>
</template>
