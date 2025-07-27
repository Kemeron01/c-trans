
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { TheMask } from "vue-the-mask";

const app = createApp(App)

app.use(store)
app.use(router)
app.mount('#app')
app.component('TheMask',TheMask)
