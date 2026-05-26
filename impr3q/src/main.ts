import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Crear la aplicación Vue
const app = createApp(App)

// Aquí puedes agregar plugins globales si los necesitas en el futuro
// Por ejemplo:
// app.use(router)
// app.use(pinia)

// Montar la aplicación en el elemento con id="app"
app.mount('#app')