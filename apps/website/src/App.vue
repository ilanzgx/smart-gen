<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import OtaUpdateBanner from './components/OtaUpdateBanner.vue'
</script>

<template>
  <Analytics />
  <RouterView />
  <OtaUpdateBanner />
</template>
