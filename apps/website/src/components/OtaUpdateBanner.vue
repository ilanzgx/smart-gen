<script setup lang="ts">
import { computed } from 'vue'
import { IconSparkles, IconLoader2, IconX } from '@tabler/icons-vue'
import { useOtaStore } from '@/stores/ota.store'
import { otaUpdateService } from '@/services/ota-update.service'

const otaStore = useOtaStore()

const isVisible = computed(() => otaStore.pendingBundle !== null)

async function handleInstall() {
  if (!otaStore.pendingBundle) return

  otaStore.setApplying()

  try {
    // Aplicação se reinicia sozinha quando a atualização é concluída com sucesso.
    // Se por algum motivo nenhum reload ocorrer, limpa o banner como fallback.
    await otaUpdateService.applyUpdate(otaStore.pendingBundle)
    otaStore.clear()
  } catch {
    otaStore.clear()
  }
}

function dismiss() {
  otaStore.clear()
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="isVisible"
      id="ota-update-banner"
      role="alert"
      aria-live="polite"
      class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900 pl-4 pr-2 py-2 text-white shadow-lg"
    >
      <div class="flex items-center gap-2 pr-1">
        <IconSparkles class="size-4 shrink-0 text-blue-400" />
        <span class="whitespace-nowrap text-sm font-medium">Nova atualização disponível</span>
      </div>

      <div class="flex items-center gap-1 border-l border-slate-700 pl-3">
        <button
          id="ota-install-button"
          :disabled="otaStore.isApplying"
          class="flex h-7 cursor-pointer items-center justify-center rounded-full bg-blue-600 px-3 text-xs font-semibold transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          @click="handleInstall"
        >
          <IconLoader2 v-if="otaStore.isApplying" class="size-3.5 animate-spin" />
          <span v-else>Instalar</span>
        </button>

        <button
          @click="dismiss"
          :disabled="otaStore.isApplying"
          class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Dispensar"
        >
          <IconX class="size-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
