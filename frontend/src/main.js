import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router/index.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, { position: 'top-right' })

app.mount('#app')
