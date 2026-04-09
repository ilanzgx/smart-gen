<script setup lang="ts">
import { sharedMessage } from '@smart-gen/shared'
</script>

<template>
  <div class="about">
    <h1>This is an about page</h1>
    <h2 class="text-3xl font-bold underline">{{ sharedMessage }}</h2>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
