<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Label, Separator, Spinner } from '@/components/ui'
import { updatePasswordSchema } from '@smart-gen/shared'
import { ref, onMounted } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const passwordUpdated = ref(false)
const isValidAccess = ref(false)
const checking = ref(true)

/*
 * Proteção contra acesso direto:
 * Quando o usuário clica no link do e-mail, o Supabase processa o hash da URL
 * (#access_token=...&type=recovery) e cria uma sessão via onAuthStateChange.
 * Se após esse tempo não houver sessão, redirecionamos para recuperar senha.
 */
onMounted(async () => {
  // Aguarda o Supabase processar o token do hash na URL
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (authStore.isAuthenticated) {
    isValidAccess.value = true
  } else {
    router.replace({ name: 'recover-password' })
  }

  checking.value = false
})

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(updatePasswordSchema),
})

const { value: password } = useField<string>('password')
const { value: confirmPassword } = useField<string>('confirmPassword')

// Atualiza a senha
const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.updatePassword(values.password)
    passwordUpdated.value = true
  } catch (error) {
    console.error('Falha ao atualizar senha:', error)
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
          <h1 class="text-2xl font-bold tracking-tight">Atualizar Senha</h1>
          <p class="text-muted-foreground text-sm">Crie uma nova senha para a sua conta</p>
        </div>

        <Separator class="my-6" />

        <!-- Verificando sessão de recuperação -->
        <div v-if="checking" class="flex flex-col items-center justify-center py-8 gap-3">
          <Spinner class="w-8 h-8" />
          <p class="text-sm text-muted-foreground">Verificando link de recuperação...</p>
        </div>

        <!-- Senha atualizada com sucesso -->
        <div v-else-if="passwordUpdated" class="space-y-4">
          <div
            class="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md text-sm text-center"
          >
            Senha atualizada com sucesso! Você já pode acessar a plataforma.
          </div>

          <Button @click="router.push('/dashboard')" class="w-full"> Acessar o Dashboard </Button>
        </div>

        <!-- Formulário de nova senha -->
        <form v-else-if="isValidAccess" @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="password">Nova Senha</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="********"
              :disabled="authStore.loading"
            />
            <p v-if="errors.password" class="text-sm font-medium text-destructive">
              {{ errors.password }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="********"
              :disabled="authStore.loading"
            />
            <p v-if="errors.confirmPassword" class="text-sm font-medium text-destructive">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <p v-if="authStore.hasError" class="text-sm font-medium text-destructive">
            {{ authStore.error }}
          </p>

          <Button type="submit" class="w-full" :disabled="authStore.loading">
            <span v-if="authStore.loading">Atualizando...</span>
            <span v-else>Atualizar Senha</span>
          </Button>
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
