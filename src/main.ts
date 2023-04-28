/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from '@/App.vue'
import UI from '@/UI.vue'
import Worker from '@/Worker.vue'

// Composables
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router'

// Plugins
import { registerPlugins } from '@/plugins'

const routes = [
    { path: '/', component: UI },
    { path: '/worker', component: Worker }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

const app = createApp(App)

registerPlugins(app)

app.use(router)

app.mount('#app')

