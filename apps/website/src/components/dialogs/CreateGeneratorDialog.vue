<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Button,
  Input,
  Label,
  Spinner,
} from '@/components/ui'
import { createGeneratorSchema } from '@smart-gen/shared'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { createGenerator, type Generator } from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'generator-created', generator: Generator): void
}>()

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(createGeneratorSchema),
  initialValues: {
    name: '',
    description: '',
    mac_address: '',
  },
})

const { value: name } = useField<string>('name')
const { value: description } = useField<string>('description')
const { value: mac_address } = useField<string>('mac_address')

const isLoading = ref(false)
const submitError = ref<string | null>(null)

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true
  submitError.value = null

  try {
    const generator = await createGenerator(supabase, {
      name: values.name,
      description: values.description,
      esp32_id: values.mac_address,
    })

    emit('generator-created', generator)
    emit('update:open', false)
    resetForm()
  } catch (error: unknown) {
    submitError.value = error instanceof Error ? error.message : 'Erro ao criar gerador'
    console.error('Erro ao criar gerador:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-106.25">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold">Registrar Gerador</DialogTitle>
        <DialogDescription class="text-gray-600 dark:text-slate-400">
          Preencha as informações para adicionar uma nova unidade de monitoramento ao seu painel.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit" class="space-y-5 mt-2">
        <div class="space-y-4">
          <!-- Nome -->
          <div class="space-y-2">
            <Label for="name" :class="{ 'text-destructive': errors.name }">Nome da Unidade</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Ex: Gerador Principal - Bloco A"
              :aria-invalid="!!errors.name"
            />
            <p v-if="errors.name" class="text-[0.8rem] font-medium text-destructive">
              {{ errors.name }}
            </p>
          </div>

          <!-- Descrição -->
          <div class="space-y-2">
            <Label for="description" :class="{ 'text-destructive': errors.description }"
              >Descrição (Opcional)</Label
            >
            <Input
              id="description"
              v-model="description"
              placeholder="Ex: Responsável pela ala sul"
              :aria-invalid="!!errors.description"
            />
            <p v-if="errors.description" class="text-[0.8rem] font-medium text-destructive">
              {{ errors.description }}
            </p>
          </div>

          <!-- Endereço MAC -->
          <div class="space-y-2">
            <Label for="mac" :class="{ 'text-destructive': errors.mac_address }"
              >Endereço MAC do Dispositivo</Label
            >
            <Input
              id="mac"
              v-model="mac_address"
              placeholder="Ex: AA:BB:CC:DD:EE:FF"
              class="font-mono text-sm"
              :aria-invalid="!!errors.mac_address"
            />
            <p v-if="errors.mac_address" class="text-[0.8rem] font-medium text-destructive">
              {{ errors.mac_address }}
            </p>
            <p v-else class="text-[0.8rem] text-muted-foreground">
              O endereço MAC físico da placa ESP32. O dispositivo ESP32 com nosso firmware irá
              disparar requisições de leituras se identificando com algum gerador com endereço MAC
              identico ao dele.
            </p>
          </div>
        </div>

        <!-- Alerta de Erro de Submissão -->
        <div
          v-if="submitError"
          class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <p>{{ submitError }}</p>
        </div>

        <DialogFooter class="pt-4">
          <DialogClose as-child>
            <Button type="button" variant="outline" @click="resetForm()" :disabled="isLoading">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading" class="min-w-32.5">
            <span v-if="isLoading" class="flex items-center gap-2">
              <Spinner />
              Salvando...
            </span>
            <span v-else>Salvar Gerador</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
