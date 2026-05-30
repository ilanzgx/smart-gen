import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth.store'
import { useOtaStore } from './stores/ota.store'
import { useThemeStore } from './stores/theme.store'
import App from './App.vue'
import router from './router'
import { otaUpdateService } from './services/ota-update.service'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
useThemeStore()

// Inicializa o plugin OTA (atualização over-the-air) e verifica se há atualizações.
// Só funciona em dispositivos mobile.
if (typeof window !== 'undefined') {
  otaUpdateService.initialize().then(async () => {
    if (!otaUpdateService.isNative) return

    const result = await otaUpdateService.checkForUpdate()
    if (result) {
      const otaStore = useOtaStore(pinia)
      otaStore.setPendingUpdate(result.bundle, result.version)
    }
  })
}

const authStore = useAuthStore()
const cleanUp = await authStore.initializeAuth()

app.use(router)
app.mount('#app')

// Quando for desmontar a aplicação, desativa o listener de eventos
const originalUnmount = app.unmount
app.unmount = () => {
  cleanUp()
  originalUnmount.call(app)
}
