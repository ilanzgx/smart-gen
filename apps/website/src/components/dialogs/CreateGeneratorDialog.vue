<script setup lang="ts">
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
} from '@/components/ui'
import { createGeneratorSchema } from '@smart-gen/shared'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
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

const onSubmit = handleSubmit(async (values) => {
  try {
    console.log(
      `Nome: ${values.name}, Descrição: ${values.description}, MAC: ${values.mac_address}`,
    )
    // Desenvolver a funcionalidade de criar gerador no pacote supabase
    //
    resetForm()
    emit('update:open', false)
  } catch (error) {
    console.error(error)
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

          <DialogFooter>
            <DialogClose as-child>
              <Button type="button" @click="(emit('update:open', false), resetForm())"
                >Cancelar</Button
              >
            </DialogClose>
            <Button type="submit"> Completar Registro </Button>
          </DialogFooter>
        </form>
      </div>
    </DialogContent>
  </Dialog>
</template>
