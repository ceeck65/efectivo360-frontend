<template>
  <div 
    v-if="!isOpen"
    class="fixed bottom-6 right-6 z-50"
  >
    <!-- Welcome message for global mode users -->
    <div
      v-if="showWelcome"
      class="mb-3 max-w-xs bg-white rounded-lg shadow-lg p-4 animate-fade-in"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
          <Bot class="w-4 h-4 text-white" />
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-900">¡Hola! Soy Efi 👋</p>
          <p class="mt-1 text-xs text-gray-600">
            Veo que aún no has configurado tu tienda. ¿Te ayudo con el proceso de setup?
          </p>
        </div>
      </div>
    </div>

    <button
      @click="openChat"
      class="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
      aria-label="Abrir chat con Efi"
    >
      <!-- Efi Icon -->
      <Bot class="w-7 h-7" />
      
      <!-- Notification badge -->
      <span 
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
      
      <!-- Tooltip -->
      <span class="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Hablar con Efi
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Botón flotante para abrir el chat con Efi
 * @module @modules/assistant/components/EfiChatBubble
 * 
 * Componente flotante en esquina inferior derecha.
 * Muestra badge de notificaciones y tooltip al hover.
 * En modo global, muestra mensaje de bienvenida de Efi.
 */
import { computed, onMounted, ref } from 'vue';
import { Bot } from 'lucide-vue-next';
import { useAssistantStore } from '../stores/assistantStore';
import { useAuthStore } from '@/stores/auth';

const store = useAssistantStore();
const authStore = useAuthStore();

const isOpen = computed(() => store.isOpen);
const unreadCount = computed(() => 0); // TODO: Implementar contador de mensajes no leídos
const showWelcome = ref(false);
const hasShownWelcome = ref(false);

// Show welcome message for global mode users
onMounted(() => {
  if (authStore.isGlobalMode && !hasShownWelcome.value) {
    setTimeout(() => {
      showWelcome.value = true;
      hasShownWelcome.value = true;
      // Auto-hide after 10 seconds
      setTimeout(() => {
        showWelcome.value = false;
      }, 10000);
    }, 2000);
  }
});

function openChat(): void {
  showWelcome.value = false;
  store.openChat();
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
