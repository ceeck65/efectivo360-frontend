import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vue3Toastify from 'vue3-toastify';
import router from './router';
import App from './App.vue';
import StorefrontApp from './views/storefront/StorefrontApp.vue';
import { isStoreHost } from './views/storefront/storefront';
import './styles/main.css';

// Efi Assistant components (global registration)
import { EfiChatBubble, EfiChatWindow } from '@modules/assistant';

// La tienda pública (store.efectivo360.app/<slug>/ o /store/<slug>) se monta con su propia raíz,
// sin los efectos del backoffice (splash, sesión, asistente, service worker).
const isStorefront = isStoreHost() || window.location.pathname.startsWith('/store/');
const app = createApp(isStorefront ? StorefrontApp : App);

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
