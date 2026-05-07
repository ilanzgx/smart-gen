<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Label, Separator } from '@/components/ui'
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
  <div class="absolute top-4 left-4">
    <RouterLink to="/">
      <img class="w-auto h-8" src="/images/logo.webp" alt="Logo" />
    </RouterLink>
  </div>

  <main class="flex min-h-screen">
    <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div class="w-full max-w-md">
        <div class="space-y-2 text-center">
          <h1 class="text-2xl font-bold tracking-tight">Entrar</h1>
          <p class="text-muted-foreground text-sm">
            Insira suas credenciais para acessar sua conta
          </p>
        </div>

        <Separator class="my-6" />

        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">E-mail</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="m@exemplo.com"
              :disabled="authStore.loading"
            />
            <p v-if="errors.email" class="text-sm font-medium text-destructive">
              {{ errors.email }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="password">Senha</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="********"
              :disabled="authStore.loading"
            />
            <p v-if="errors.password" class="text-sm font-medium text-destructive">
              {{ errors.password }}
            </p>
            <div class="flex justify-end mt-1">
              <RouterLink
                to="/recuperar-senha"
                class="text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                Esqueceu a sua senha?
              </RouterLink>
            </div>
          </div>

          <p v-if="authStore.hasError" class="text-sm font-medium text-destructive">
            {{ authStore.error }}
          </p>

          <Button type="submit" class="w-full" :disabled="authStore.loading">
            <span v-if="authStore.loading">Entrando...</span>
            <span v-else>Entrar</span>
          </Button>

          <p class="text-center text-sm text-muted-foreground pt-4">
            Não tem uma conta?
            <RouterLink
              to="/cadastrar"
              class="font-bold hover:text-foreground underline-offset-4 hover:underline transition-colors ml-1"
            >
              Cadastre-se
            </RouterLink>
          </p>
        </form>
      </div>
    </div>

    <div class="hidden lg:block relative flex-1">
      <img
        src="/images/main.webp"
        alt="Smart Gen"
        class="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />

      <div class="absolute inset-0 bg-black/10" />
    </div>
  </main>
</template>
