<template>
  <button
    v-if="deferredPrompt"
    @click="install"
    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
  >
    <span class="text-lg">📲</span>
    Instalar Aplicación
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const deferredPrompt = ref<Event | null>(null);

function handler(e: Event) {
  e.preventDefault();
  deferredPrompt.value = e;
}

function onInstalled() {
  deferredPrompt.value = null;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handler);
  window.addEventListener('appinstalled', onInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handler);
  window.removeEventListener('appinstalled', onInstalled);
});

async function install() {
  if (!deferredPrompt.value) return;
  (deferredPrompt.value as any).prompt();
  const { outcome } = await (deferredPrompt.value as any).userChoice;
  if (outcome === 'accepted') deferredPrompt.value = null;
}
</script>
