import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BundleInfo } from '@capgo/capacitor-updater'

export const useOtaStore = defineStore('ota', () => {
  const pendingBundle = ref<BundleInfo | null>(null)
  const isApplying = ref(false)
  const updateVersion = ref<string | null>(null)

  function setPendingUpdate(bundle: BundleInfo, version: string) {
    pendingBundle.value = bundle
    updateVersion.value = version
  }

  function setApplying() {
    isApplying.value = true
  }

  function clear() {
    pendingBundle.value = null
    updateVersion.value = null
    isApplying.value = false
  }

  return {
    pendingBundle,
    isApplying,
    updateVersion,
    setPendingUpdate,
    setApplying,
    clear,
  }
})
