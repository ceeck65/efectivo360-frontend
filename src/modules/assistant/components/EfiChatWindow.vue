<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-semibold text-sm">Efi</h3>
            <p class="text-xs text-blue-100 flex items-center gap-1">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Asistente IA
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-1">
          <button
            v-if="hasMessages"
            @click="startNewChat"
            class="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Nueva conversación"
          >
            <Plus class="w-5 h-5" />
          </button>
          <button
            @click="closeChat"
            class="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Context indicator -->
      <div
        v-if="contextDescription"
        class="bg-blue-50 px-4 py-2 text-xs text-blue-700 flex items-center gap-2 border-b border-blue-100"
      >
        <MapPin class="w-3 h-3" />
        {{ contextDescription }}
      </div>

      <!-- Messages area -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        <!-- Empty state -->
        <div v-if="!hasMessages" class="text-center py-8">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot class="w-8 h-8 text-blue-600" />
          </div>
          <p class="text-gray-600 text-sm mb-2">¡Hola! Soy Efi, tu asistente de IA</p>
          <p class="text-gray-500 text-xs">Puedo ayudarte con información sobre inventario, ventas, pagos y más.</p>
        </div>

        <!-- Messages -->
        <template v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
              :class="{
                'bg-blue-600 text-white rounded-br-md': message.role === 'user',
                'bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100': message.role === 'assistant',
                'bg-red-50 text-red-700 border-red-100': message.status === 'error',
              }"
            >
              <p class="whitespace-pre-wrap">{{ message.content }}</p>
              
              <!-- Streaming indicator -->
              <span
                v-if="message.status === 'streaming'"
                class="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1"
              ></span>
              
              <!-- Timestamp -->
              <p
                class="text-xs mt-1 opacity-70"
                :class="message.role === 'user' ? 'text-blue-100' : 'text-gray-400'"
              >
                {{ formatTime(message.createdAt) }}
              </p>
            </div>
          </div>
        </template>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="flex justify-start">
          <div class="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      <div
        v-if="suggestions.length > 0 && !hasMessages"
        class="px-4 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2"
      >
        <button
          v-for="suggestion in suggestions.slice(0, 3)"
          :key="suggestion.id"
          @click="sendMessage(suggestion.prompt)"
          class="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          {{ suggestion.label }}
        </button>
      </div>

      <!-- Input area -->
      <div class="p-4 bg-white border-t border-gray-200 shrink-0">
        <div class="flex items-end gap-2">
          <textarea
            v-model="inputMessage"
            @keydown.enter.prevent="handleEnter"
            placeholder="Escribe tu mensaje..."
            class="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24"
            rows="1"
            :disabled="isLoading"
          ></textarea>
          
          <button
            @click="sendMessage()"
            :disabled="!canSend"
            class="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send v-if="!isLoading" class="w-5 h-5" />
            <Loader2 v-else class="w-5 h-5 animate-spin" />
          </button>
        </div>
        
        <p class="text-xs text-gray-400 mt-2 text-center">
          Efi puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * @fileoverview Ventana de chat con Efi
 * @module @modules/assistant/components/EfiChatWindow
 * 
 * Contenedor principal del chat que muestra:
 * - Header con info de Efi
 * - Indicador de contexto actual
 * - Lista de mensajes
 * - Sugerencias contextuales
 * - Input de mensajes
 */
import { ref, watch, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Bot, X, Plus, Send, Loader2, MapPin } from 'lucide-vue-next';
import { useAssistantStore } from '../stores/assistantStore';
import { useEfi } from '../composables/useEfi';

// =============================================================================
// SETUP
// =============================================================================

const store = useAssistantStore();
const efi = useEfi();

const { 
  isOpen, 
  messages, 
  isLoading, 
  isTyping 
} = storeToRefs(store);

const {
  inputMessage,
  suggestions,
  canSend,
  hasMessages,
  contextDescription,
  sendMessage,
  startNewChat,
  closeChat,
  initialize,
} = efi;

// DOM refs
const messagesContainer = ref<HTMLElement | null>(null);

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  initialize();
});

// Auto-scroll to bottom when messages change
watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

watch(isTyping, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

// =============================================================================
// METHODS
// =============================================================================

function scrollToBottom(): void {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function handleEnter(event: KeyboardEvent): void {
  if (!event.shiftKey && canSend.value) {
    sendMessage();
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
