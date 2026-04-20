<script setup lang="ts">
import { supabase } from '@/lib/supabase'
import { getUser } from '@smart-gen/supabase'
import { onMounted, ref } from 'vue'
import imagem_G from '@/assets/generic-avatar.svg'
import Button from '@/components/ui/button/Button.vue'
import HeaderComponent from '@/components/HeaderComponent.vue'
import { useAuthStore } from '@/stores/auth.store'


const name = ref<string | null>(null)
const email = useAuthStore().userEmail

var imagem_generica = ref(imagem_G)
onMounted(async () => {
  const userResponse = await getUser(supabase)
  name.value = userResponse.user_metadata?.name || userResponse.email
})
</script>

<template>
  <HeaderComponent></HeaderComponent>
  <main>
    <div class="mx-2">
    <Button>← voltar</Button>
    </div>
    <div class="bg-gray-200 p-5 mx-50 grid place-content-center rounded-lg">
      <img class="rounded-full w-35 h-35 shadow-xl m-5" :src="imagem_generica" />
      <hr />
      <!-- nome do usuario -->
      <div class="grid place-content-center">
        <label>Nome do usuario:</label>
        <span class="bg-gray-300 px-3 py-2 rounded-xl">{{ name }}</span>
        <!-- email do usuario -->
        <label>Email:</label>
        <span class="bg-gray-300 px-3 py-2 rounded-xl">{{ email }}</span>
        <label>Acesso:</label>
        <span class="bg-gray-300 px-3 py-2 rounded-xl">Admin</span>
      </div>
      <Button class="my-3">Alterar perfil</Button>
    </div>
  </main>
</template>

<style>
</style>
