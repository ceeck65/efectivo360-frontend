<template>
  <div 
    v-if="!isOpen"
    class="fixed bottom-6 right-6 z-50"
  >
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
 */
import { computed } from 'vue';
import { Bot } from 'lucide-vue-next';
import { useAssistantStore } from '../stores/assistantStore';

const store = useAssistantStore();

const isOpen = computed(() => store.isOpen);
const unreadCount = computed(() => 0); // TODO: Implementar contador de mensajes no leídos

function openChat(): void {
  store.openChat();
}
</script>
