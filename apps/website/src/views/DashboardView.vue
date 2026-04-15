<script setup lang="ts">
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { getUser, type User } from '@smart-gen/supabase';
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

const name = ref<User | null>(null);

function logout() {
  useAuthStore().signOut();
}

onMounted(async () => {
  name.value = (await getUser(supabase)).user_metadata?.name;
});
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-bold tracking-tight">👋 Olá, {{ name }}</h1>
      </div>

      <div class="space-y-2 text-center">
        <RouterLink to="/">
          <button @click="logout" class="text-blue-600 hover:underline">Logout</button>
        </RouterLink>
      </div>
    </div>
  </main>

</template>

