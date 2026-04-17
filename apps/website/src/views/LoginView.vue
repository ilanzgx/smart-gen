<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Label } from '@/components/ui'
import { loginSchema } from '@smart-gen/shared'

const router = useRouter()
const authStore = useAuthStore()

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const { value: email } = useField<string>('email')
const { value: password } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.signIn({ email: values.email, password: values.password })
    router.push('/dashboard')
  } catch (error) {
    console.error('Falha no login:', error)
  }
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-bold tracking-tight">Entrar</h1>
        <p class="text-muted-foreground text-sm">Insira suas credenciais para acessar sua conta</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="email">E-mail</Label>
          <Input
            id="email"
            v-model="email"
            type="text"
            placeholder="m@exemplo.com"
            :disabled="authStore.loading"
          />
          <p v-if="errors.email" class="text-sm font-medium text-destructive">
            {{ errors.email }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="password">Senha</Label>
          <Input id="password" v-model="password" type="password" :disabled="authStore.loading" />
          <p v-if="errors.password" class="text-sm font-medium text-destructive">
            {{ errors.password }}
          </p>
        </div>

        <p v-if="authStore.hasError" class="text-sm font-medium text-destructive">
          {{ authStore.error }}
        </p>

        <Button type="submit" class="w-full" :disabled="authStore.loading">
          <span v-if="authStore.loading">Entrando...</span>
          <span v-else>Entrar</span>
        </Button>
        
        <p class="text-center text-sm text-muted-foreground pt-2">
          Não tem uma conta? 
          <RouterLink to="/cadastrar" class="font-medium text-primary hover:underline transition-colors">
            Cadastre-se
          </RouterLink>
        </p>
      </form>
    </div>
  </main>
</template>

