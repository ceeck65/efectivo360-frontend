import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vue3Toastify from 'vue3-toastify';
import router from './router';
import App from './App.vue';
import './styles/main.css';

// Efi Assistant components (global registration)
import { EfiChatBubble, EfiChatWindow } from '@modules/assistant';

const app = createApp(App);

// Pinia store
const pinia = createPinia();
app.use(pinia);

// Toast notifications
app.use(Vue3Toastify, {
  autoClose: 5000,
  position: 'top-right',
  theme: 'light',
});
// Register Efi components globally
app.component('EfiChatBubble', EfiChatBubble);
app.component('EfiChatWindow', EfiChatWindow);


app.use(router);

app.mount('#app');
