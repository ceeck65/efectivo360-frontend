<template>
  <!-- Botón flotante Efi -->
  <div class="efi-widget-container">
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="efi-floating-btn"
      :class="{ 'pulse': isLoading }"
      aria-label="Abrir chat con Efi"
    >
      <div class="relative">
        <img
          src="/efi-avatar.svg"
          alt="Efi"
          class="w-10 h-10 rounded-full"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
        />
        <div class="efi-avatar-fallback" style="display: none;">
          <Bot class="w-6 h-6" />
        </div>
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </div>
    </button>

    <!-- Ventana de chat -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-4"
    >
      <div
        v-if="isOpen"
        class="efi-chat-window"
        :class="{ 'fullscreen': isFullscreen }"
      >
        <!-- Header -->
        <div class="efi-chat-header">
          <div class="flex items-center gap-3">
            <div class="efi-avatar">
              <Bot class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white text-sm truncate">
                Efi Assistant
              </h3>
              <p class="text-xs text-white/70 truncate">
                {{ sessionTitle || 'Tu asistente de negocio' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="toggleFullscreen"
              class="efi-header-btn"
              :title="isFullscreen ? 'Minimizar' : 'Pantalla completa'"
            >
              <Minimize2 v-if="isFullscreen" class="w-4 h-4" />
              <Maximize2 v-else class="w-4 h-4" />
            </button>
            <button
              @click="clearChat"
              class="efi-header-btn"
              title="Nueva conversación"
            >
              <Plus class="w-4 h-4" />
            </button>
            <button
              @click="toggleChat"
              class="efi-header-btn"
              title="Cerrar"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Mensajes -->
        <div
          ref="messagesContainer"
          class="efi-messages-container"
          @scroll="handleScroll"
        >
          <!-- Mensaje de bienvenida -->
          <div v-if="messages.length === 0" class="efi-welcome">
            <div class="efi-welcome-icon">
              <Sparkles class="w-8 h-8 text-primary" />
            </div>
            <h4 class="font-semibold text-foreground mb-2">
              ¡Hola! Soy Efi
            </h4>
            <p class="text-sm text-muted-foreground text-center max-w-xs">
              Tu asistente inteligente para gestionar tu negocio.
              Pregúntame sobre tus ventas, inventario o cualquier duda.
            </p>
            <div class="flex flex-wrap gap-2 mt-4 justify-center">
              <button
                v-for="suggestion in quickSuggestions"
                :key="suggestion"
                @click="sendMessage(suggestion)"
                class="efi-suggestion-btn"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Lista de mensajes -->
          <div
            v-for="message in messages"
            :key="message.ulid"
            class="efi-message-wrapper"
            :class="message.role"
          >
            <!-- Avatar -->
            <div
              v-if="message.role === 'assistant'"
              class="efi-message-assistant-avatar"
            >
              <Bot class="w-4 h-4" />
            </div>

            <!-- Burbuja de mensaje -->
            <div
              class="efi-message-bubble"
              :class="message.role"
            >
              <!-- Loading indicator -->
              <div v-if="message.isLoading" class="efi-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <!-- Contenido del mensaje (Markdown) -->
              <div
                v-else
                class="efi-message-content"
                v-html="renderMarkdown(message.content)"
              />

              <!-- Timestamp -->
              <span class="efi-message-time">
                {{ formatTime(message.created_at) }}
              </span>
            </div>

            <!-- Avatar usuario -->
            <div
              v-if="message.role === 'user'"
              class="efi-message-user-avatar"
            >
              <User class="w-4 h-4" />
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="efi-message-wrapper assistant">
            <div class="efi-message-assistant-avatar">
              <Bot class="w-4 h-4" />
            </div>
            <div class="efi-message-bubble assistant typing">
              <div class="efi-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <!-- Scroll to bottom button -->
          <button
            v-if="showScrollButton"
            @click="scrollToBottom"
            class="efi-scroll-btn"
          >
            <ChevronDown class="w-4 h-4" />
          </button>
        </div>

        <!-- Input area -->
        <div class="efi-input-area">
          <form
            @submit.prevent="handleSubmit"
            class="flex items-end gap-2"
          >
            <div class="flex-1 relative">
              <textarea
                v-model="inputMessage"
                ref="inputRef"
                rows="1"
                class="efi-textarea"
                placeholder="Escribe tu mensaje..."
                :disabled="isLoading || isTyping"
                @keydown.enter.prevent="handleEnterKey"
                @input="autoResize"
              />
            </div>
            <button
              type="submit"
              class="efi-send-btn"
              :disabled="!inputMessage.trim() || isLoading || isTyping"
              :class="{ 'opacity-50 cursor-not-allowed': !inputMessage.trim() || isLoading || isTyping }"
            >
              <Send v-if="!isLoading" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { marked } from 'marked';
import {
  Bot,
  X,
  Send,
  Loader2,
  User,
  Sparkles,
  ChevronDown,
  Maximize2,
  Minimize2,
  Plus,
} from 'lucide-vue-next';
import { useEfiChat } from '@/composables/useEfiChat';

// Props
interface Props {
  tenantUlid?: string;
}

defineProps<Props>()

// Use EfiChat composable
const {
  isLoading,
  isTyping,
  messages,
  currentSession,
  loadStoredSession,
  startNewSession,
  sendMessage: sendMessageToEfi,
} = useEfiChat();

// Local UI state
const isOpen = ref(false);
const isFullscreen = ref(false);
const inputMessage = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const showScrollButton = ref(false);
const unreadCount = ref(0);

// Computed session title
const sessionTitle = computed(() => currentSession.value?.title || '');

// Quick suggestions
const quickSuggestions = [
  '¿Cómo van mis ventas hoy?',
  '¿Cuál es la tasa del día?',
  'Analiza mi inventario',
  '¿Qué productos venden más?',
];

// Toggle chat window
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    unreadCount.value = 0;
    nextTick(() => {
      scrollToBottom();
      inputRef.value?.focus();
    });
  }
};

// Toggle fullscreen
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  nextTick(() => scrollToBottom());
};

// Handle scroll in messages container
const handleScroll = () => {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  showScrollButton.value = scrollHeight - scrollTop - clientHeight > 100;
};

// Scroll to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      showScrollButton.value = false;
    }
  });
};

// Format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Render markdown using marked library
const renderMarkdown = (content: string): string => {
  if (!content) return '';

  try {
    // Configure marked for safe rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // Render markdown to HTML
    let html = marked.parse(content) as string;

    // Add target="_blank" to all links for security
    html = html.replace(
      /<a(.*?)href="(.*?)"(.*?)>/g,
      '<a$1href="$2"$3 target="_blank" rel="noopener noreferrer" class="efi-link">'
    );

    return html;
  } catch (e) {
    console.error('Error rendering markdown:', e);
    // Fallback: escape HTML and return plain text
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
};

// Auto resize textarea
const autoResize = () => {
  const textarea = inputRef.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }
};

// Handle enter key (send if not shift+enter)
const handleEnterKey = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    handleSubmit();
  }
};

// Send message - uses composable
const sendMessage = async (content: string) => {
  if (!content.trim() || isLoading.value || isTyping.value) return;

  // Clear input immediately for better UX
  inputMessage.value = '';
  autoResize();
  scrollToBottom();

  // Use composable to send message
  const success = await sendMessageToEfi(content);

  if (success) {
    scrollToBottom();
  }
};

// Handle form submit
const handleSubmit = () => {
  sendMessage(inputMessage.value);
};

// Clear chat and start new session
const clearChat = async () => {
  await startNewSession();
  scrollToBottom();
};

// Initialize on mount - load stored session
onMounted(() => {
  loadStoredSession();
});

// Expose toggle function for parent components
defineExpose({
  toggleChat,
});
</script>

<style scoped>
/* Contenedor principal */
.efi-widget-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
}

/* Botón flotante */
.efi-floating-btn {
  @apply w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg 
         flex items-center justify-center cursor-pointer transition-all duration-300
         hover:scale-110 hover:shadow-xl active:scale-95;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
}

.efi-floating-btn.pulse {
  animation: efi-pulse 2s infinite;
}

@keyframes efi-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 180, 255, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(0, 180, 255, 0); }
}

.efi-avatar-fallback {
  @apply w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white;
}

/* Ventana de chat */
.efi-chat-window {
  @apply w-[360px] h-[500px] bg-background border border-border rounded-2xl shadow-2xl 
         flex flex-col overflow-hidden;
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
}

.efi-chat-window.fullscreen {
  @apply w-[calc(100vw-3rem)] h-[calc(100vh-3rem)];
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  bottom: 1.5rem;
}

/* Header */
.efi-chat-header {
  @apply px-4 py-3 flex items-center justify-between shrink-0;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
}

.efi-avatar {
  @apply w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white;
}

.efi-header-btn {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-white/80 
         hover:bg-white/20 hover:text-white transition-colors;
}

/* Contenedor de mensajes */
.efi-messages-container {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
  scroll-behavior: smooth;
}

/* Mensaje de bienvenida */
.efi-welcome {
  @apply flex flex-col items-center justify-center h-full text-center px-6;
}

.efi-welcome-icon {
  @apply w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4;
}

.efi-suggestion-btn {
  @apply px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-full 
         hover:bg-secondary/80 transition-colors border border-border;
}

/* Wrapper de mensaje */
.efi-message-wrapper {
  @apply flex items-end gap-2;
}

.efi-message-wrapper.user {
  @apply justify-end;
}

.efi-message-wrapper.assistant {
  @apply justify-start;
}

/* Avatares */
.efi-message-assistant-avatar {
  @apply w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center 
         text-primary shrink-0;
}

.efi-message-user-avatar {
  @apply w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center 
         text-blue-500 shrink-0;
}

/* Burbujas de mensaje */
.efi-message-bubble {
  @apply max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed;
}

.efi-message-bubble.user {
  @apply bg-blue-500 text-white rounded-br-md;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.efi-message-bubble.assistant {
  @apply bg-muted text-foreground rounded-bl-md border border-border;
}

.efi-message-bubble.typing {
  @apply py-3;
}

/* Contenido del mensaje */
.efi-message-content {
  @apply text-sm leading-relaxed max-w-none;
}

.efi-message-content :deep(p) {
  @apply mb-2 last:mb-0;
}

.efi-message-content :deep(strong) {
  @apply font-semibold;
}

.efi-message-content :deep(em) {
  @apply italic;
}

.efi-message-content :deep(code) {
  @apply px-1.5 py-0.5 bg-muted rounded text-xs font-mono;
}

.efi-message-content :deep(pre) {
  @apply p-3 bg-muted rounded-lg overflow-x-auto my-2;
}

.efi-message-content :deep(pre code) {
  @apply p-0 bg-transparent;
}

.efi-message-content :deep(a) {
  @apply text-primary underline hover:no-underline;
}

.efi-message-content :deep(br) {
  @apply block content-[''] mb-1;
}

/* Timestamp */
.efi-message-time {
  @apply block text-[10px] opacity-60 mt-1 text-right;
}

/* Loading dots */
.efi-loading-dots {
  @apply flex items-center gap-1 py-1;
}

.efi-loading-dots span {
  @apply w-2 h-2 rounded-full bg-current animate-bounce;
}

.efi-loading-dots span:nth-child(2) {
  animation-delay: 0.1s;
}

.efi-loading-dots span:nth-child(3) {
  animation-delay: 0.2s;
}

/* Typing indicator */
.efi-typing-indicator {
  @apply flex items-center gap-1 py-1 px-2;
}

.efi-typing-indicator span {
  @apply w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce;
}

.efi-typing-indicator span:nth-child(2) {
  animation-delay: 0.1s;
}

.efi-typing-indicator span:nth-child(3) {
  animation-delay: 0.2s;
}

/* Scroll button */
.efi-scroll-btn {
  @apply absolute bottom-4 right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground 
         shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors;
}

/* Input area */
.efi-input-area {
  @apply p-3 border-t border-border bg-background shrink-0;
}

.efi-textarea {
  @apply w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm 
         resize-none outline-none transition-all min-h-[44px] max-h-[120px]
         focus:ring-2 focus:ring-primary/20 focus:border-primary
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.efi-send-btn {
  @apply w-10 h-10 rounded-full bg-primary text-primary-foreground 
         flex items-center justify-center shrink-0 transition-all
         hover:bg-primary/90 active:scale-95;
}

/* Animaciones personalizadas */
@keyframes efi-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.efi-message-wrapper {
  animation: efi-fade-in 0.3s ease-out;
}

/* Responsive */
@media (max-width: 480px) {
  .efi-chat-window {
    @apply w-[calc(100vw-2rem)] h-[60vh];
    right: 1rem;
    bottom: 4.5rem;
  }

  .efi-floating-btn {
    @apply w-12 h-12;
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
