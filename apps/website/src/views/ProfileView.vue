<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { Input, Button } from '@/components/ui'
import { UserRound, Pen, LockIcon, UserRoundKeyIcon, XIcon, CheckIcon } from 'lucide-vue-next'

const { user } = useAuthStore()
const name = ref(user?.user_metadata.name)
const name_temp = ref(name.value)
const email = ref(user?.user_metadata.email)

const elmBoxAlteracao = ref()
const elmInputName = ref()

function mostrarBox() {
  elmBoxAlteracao.value.classList.remove('hidden')
}
function esconderBox() {
  elmBoxAlteracao.value.classList.add('hidden')
}

function salvarAlte() {
  console.log('alterações salvas')
  name.value = name_temp.value
  esconderBox()
}

function descartarAlte() {
  name_temp.value = name.value
  console.log('alterações descartadas')
  esconderBox()
}
</script>

<template>
  <DashboardLayout>
    <main>
      <!-- Div da foto -->
      <div class="border-1 dark:border-slate-800 p-5 m-1 mx-auto rounded-lg md:w-110 relative flex flex-col shadow-xl dark:bg-slate-900">
        <!--grupo da imagem-->
        <div class="cursor-pointer group relative w-32 h-32 m-5 mx-auto">
          <UserRound class="bg-gray-200 dark:bg-slate-700 w-full h-full rounded-full p-2 shadow-xl"></UserRound>
          <div
            class="bg-gray-200 dark:bg-slate-700 absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full ease-in"
          >
            <Pen class="w-32 h-full p-5"></Pen>
          </div>
        </div>

        <div class="flex flex-col">
          <label>nome do usuario:</label>
          <div class="flex bg-gray-200 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg relative">
            <Input @change="mostrarBox" ref="elmInputName" class="w-full" v-model="name_temp" />
            <pen class="mx-2 absolute right-0 bottom-2"></pen>
          </div>

          <label>email do usuario:</label>
          <div class="p-2 bg-gray-200 dark:bg-slate-800 flex rounded-lg cursor-not-allowed">
            <span class="w-full">{{ email }}</span>
            <LockIcon></LockIcon>
          </div>

          <label>acesso:</label>
          <div class="p-2 bg-gray-200 dark:bg-slate-800 flex rounded-lg cursor-not-allowed">
            <span class="w-full">admin</span>
            <UserRoundKeyIcon></UserRoundKeyIcon>
          </div>
        </div>

        <div
          ref="elmBoxAlteracao"
          class="hidden flex flex-col md:flex-row w-full justify-around gap-5 my-5"
        >
          <Button @click="salvarAlte" class="m-2 ring-2 ring-green-600 hover:bg-green-600"
            ><CheckIcon></CheckIcon> salvar alterações</Button
          >
          <Button @click="descartarAlte" class="m-2 ring-2 ring-red-600 hover:bg-red-600"
            ><XIcon></XIcon> descartar alterações</Button
          >
        </div>
      </div>
    </main>
  </DashboardLayout>
</template>
