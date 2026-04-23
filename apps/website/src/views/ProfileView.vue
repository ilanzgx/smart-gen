<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { Input, Button } from '@/components/ui'

const { user } = useAuthStore()
const name = ref(user?.user_metadata.name)
const email = ref(user?.user_metadata.email)

onMounted(() => {
  console.log(user)
})
</script>

<template>
  <DashboardLayout>
    <main class="flex justify-center">
      <div class="mx-2"></div>
      <div class="md:bg-gray-200 p-5 grid md:place-content-center rounded-lg md:w-[40%]">
        <img
          class="mx-auto rounded-full w-35 h-35 shadow-xl m-5 bg-gray-300 p-2"
          src="/images/user.svg"
          alt="User"
        />
        <hr />
        <form class="grid place-content-center">
          <!-- nome do usuario -->
          <label>Nome do usuario:</label>
          <Input class="bg-gray-300 px-3 py-2 rounded-xl" v-model="name" />
          <!-- email do usuario -->
          <label>Email:</label>
          <Input class="bg-gray-300 px-3 py-2 rounded-xl" v-model="email" />
          <label>Acesso:</label>
          <span class="bg-gray-300 px-3 py-2 rounded-xl">Admin</span>
          <Button class="bg-blue-500 my-10">Alterar</Button>
        </form>
      </div>
    </main>
  </DashboardLayout>
</template>
