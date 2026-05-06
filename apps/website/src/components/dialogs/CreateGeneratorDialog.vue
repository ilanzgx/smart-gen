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
  Spinner,
} from '@/components/ui'
import { createGeneratorSchema } from '@smart-gen/shared'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { createGenerator, type Generator } from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'

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
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="text-xl font-bold">Registrar Gerador</DialogTitle>
        <DialogDescription class="text-sm text-gray-400">
          Registre um novo gerador informando os dados abaixo.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <label for="name">Nome</label>
            <Input id="name" v-model="name" placeholder="Atribua um nome ao gerador" />
            <span v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</span>
          </div>
          <div class="space-y-2">
            <label for="description">Descrição</label>
            <Input id="description" v-model="description" placeholder="Descreva o gerador" />
            <span v-if="errors.description" class="text-sm text-red-500">{{
              errors.description
            }}</span>
          </div>
          <div class="space-y-2">
            <label for="mac">Endereço MAC do ESP32</label>
            <Input id="mac" v-model="mac_address" placeholder="Digite o endereço MAC do ESP32" />
            <span v-if="errors.mac_address" class="text-sm text-red-500">{{
              errors.mac_address
            }}</span>
          </div>

          <div v-if="submitError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ submitError }}</p>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button type="button" variant="outline" @click="resetForm()">Cancelar</Button>
            </DialogClose>
            <Button type="submit" :disabled="isLoading">
              <span v-if="isLoading" class="flex items-center gap-2">
                <Spinner />
                Criando...
              </span>
              <span v-else>Completar Registro</span>
            </Button>
          </DialogFooter>
        </form>
      </div>
    </DialogContent>
  </Dialog>
</template>
