import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth.store'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

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
