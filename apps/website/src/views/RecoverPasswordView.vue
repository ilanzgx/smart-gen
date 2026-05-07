<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Label, Separator } from '@/components/ui'
import { recoverPasswordSchema } from '@smart-gen/shared'

const router = useRouter()
const authStore = useAuthStore()
const emailSent = ref(false)

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(recoverPasswordSchema),
})

const { value: email } = useField<string>('email')

// Envia o e-mail de recuperação
const onSubmit = handleSubmit(async (values) => {
  try {
    const redirectTo = `${window.location.origin}/atualizar-senha`
    await authStore.recoverPassword(values.email, redirectTo)
    emailSent.value = true
  } catch (error) {
    console.error('Falha ao enviar e-mail de recuperação:', error)
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
          <h1 class="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
          <p class="text-muted-foreground text-sm">
            Insira o seu e-mail para receber um link de redefinição
          </p>
        </div>

        <Separator class="my-6" />

        <div v-if="emailSent" class="space-y-4">
          <div
            class="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md text-sm text-center"
          >
            Um link de redefinição foi enviado para o seu e-mail. Por favor, verifique a sua caixa
            de entrada e a pasta de spam.
          </div>

          <Button @click="router.push('/entrar')" class="w-full" variant="outline">
            Voltar para o Login
          </Button>
        </div>

        <form v-else @submit.prevent="onSubmit" class="space-y-4">
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

          <p v-if="authStore.hasError" class="text-sm font-medium text-destructive">
            {{ authStore.error }}
          </p>

          <Button type="submit" class="w-full" :disabled="authStore.loading">
            <span v-if="authStore.loading">Enviando...</span>
            <span v-else>Enviar Link de Redefinição</span>
          </Button>

          <p class="text-center text-sm text-muted-foreground pt-4">
            Lembrou da senha?
            <RouterLink
              to="/entrar"
              class="font-bold hover:text-foreground underline-offset-4 hover:underline transition-colors ml-1"
            >
              Voltar ao login
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
