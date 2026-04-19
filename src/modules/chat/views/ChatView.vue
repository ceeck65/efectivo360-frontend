<template>
  <div class="chat-container">
    <!-- Sidebar con lista de contactos -->
    <div class="chat-sidebar">
      <div class="chat-header">
        <h2 class="chat-title">Mensajes</h2>
        <button class="new-chat-btn" @click="startNewChat">
          <MessageSquarePlus :size="20" />
        </button>
      </div>

      <div class="contacts-list">
        <div
          v-for="session in sessions"
          :key="session.ulid"
          class="contact-item"
          :class="{ active: selectedSession?.ulid === session.ulid }"
          @click="selectSession(session)"
        >
          <div class="contact-avatar">
            <User :size="24" />
          </div>
          <div class="contact-info">
            <div class="contact-name">{{ session.title }}</div>
            <div class="contact-last-message">
              {{ getLastMessage(session) }}
            </div>
          </div>
          <div class="contact-meta">
            <div class="contact-time">{{ formatTime(session.updated_at) }}</div>
            <div v-if="hasUnread(session)" class="unread-badge">
              {{ getUnreadCount(session) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ventana de mensajes -->
    <div class="chat-messages-area">
      <div v-if="selectedSession" class="chat-window">
        <div class="chat-window-header">
          <div class="chat-window-title">
            <User :size="20" />
            <span>{{ selectedSession.title }}</span>
          </div>
          <button class="close-chat-btn" @click="closeChat">
            <X :size="20" />
          </button>
        </div>

        <div ref="messagesContainer" class="messages-container">
          <div
            v-for="message in messages"
            :key="message.ulid"
            class="message"
            :class="{
              'message-user': message.role === 'user',
              'message-assistant': message.role === 'assistant',
            }"
          >
            <div class="message-content">
              {{ message.content }}
            </div>
            <div class="message-time">
              {{ formatTime(message.created_at) }}
            </div>
          </div>
          <div v-if="isLoading" class="message message-assistant">
            <div class="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div class="message-input-area">
          <textarea
            v-model="newMessage"
            class="message-input"
            placeholder="Escribe un mensaje..."
            rows="1"
            @keydown.enter.prevent="sendMessage"
            @input="autoResize"
          />
          <button
            class="send-btn"
            :disabled="!newMessage.trim() || isLoading"
            @click="sendMessage"
          >
            <Send :size="20" />
          </button>
        </div>
      </div>

      <div v-else class="chat-empty-state">
        <MessageSquare :size="48" class="empty-icon" />
        <h3>Selecciona un chat</h3>
        <p>O inicia una nueva conversación</p>
      </div>
    </div>

    <!-- Notificación flotante -->
    <div v-if="showNotification" class="chat-notification" @click="openLatestChat">
      <div class="notification-content">
        <MessageSquare :size="20" />
        <span>Nuevo mensaje</span>
      </div>
      <button class="notification-close" @click.stop="dismissNotification">
        <X :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { MessageSquare, MessageSquarePlus, User, X, Send } from 'lucide-vue-next';
import { useNotify } from '@/composables/useNotify';
import { fetchChatSessions, sendMessage as sendChatMessage } from '../services/chat.service';
import type { ChatSession, ChatMessage } from '../types';

const { success: notifySuccess, error: notifyError } = useNotify();

const sessions = ref<ChatSession[]>([]);
const selectedSession = ref<ChatSession | null>(null);
const messages = ref<ChatMessage[]>([]);
const newMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const showNotification = ref(false);
const unreadCounts = ref<Record<string, number>>({});

const loadSessions = async () => {
  try {
    sessions.value = await fetchChatSessions();
  } catch (error) {
    notifyError('No se pudieron cargar los chats.');
  }
};

const selectSession = async (session: ChatSession) => {
  selectedSession.value = session;
  messages.value = session.messages || [];
  unreadCounts.value[session.ulid] = 0;
  await scrollToBottom();
};

const startNewChat = () => {
  selectedSession.value = null;
  messages.value = [];
  newMessage.value = '';
};

const closeChat = () => {
  selectedSession.value = null;
  messages.value = [];
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return;

  const messageText = newMessage.value.trim();
  newMessage.value = '';

  // Agregar mensaje del usuario a la UI inmediatamente
  const tempMessage: ChatMessage = {
    ulid: `temp-${Date.now()}`,
    session_ulid: selectedSession.value?.ulid || '',
    tenant_ulid: selectedSession.value?.tenant_ulid || null,
    user_ulid: '',
    role: 'user',
    content: messageText,
    created_at: new Date().toISOString(),
  };
  messages.value.push(tempMessage);
  await scrollToBottom();

  try {
    isLoading.value = true;
    const response = await sendChatMessage(
      messageText,
      selectedSession.value?.ulid
    );

    if (response.success) {
      // Reemplazar mensaje temporal con mensaje real
      const userMsgIndex = messages.value.findIndex(m => m.ulid === tempMessage.ulid);
      if (userMsgIndex !== -1) {
        messages.value[userMsgIndex] = {
          ...tempMessage,
          ulid: response.user_message_ulid,
          session_ulid: response.session_ulid,
        };
      }

      // Agregar respuesta de Efi
      const assistantMessage: ChatMessage = {
        ulid: response.message_ulid,
        session_ulid: response.session_ulid,
        tenant_ulid: selectedSession.value?.tenant_ulid || null,
        user_ulid: '',
        role: 'assistant',
        content: response.response,
        context_used: response.context_used,
        created_at: new Date().toISOString(),
      };
      messages.value.push(assistantMessage);

      // Actualizar o crear sesión
      if (!selectedSession.value) {
        const newSession: ChatSession = {
          ulid: response.session_ulid,
          tenant_ulid: null,
          user_ulid: '',
          title: messageText.slice(0, 30) + '...',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        sessions.value.unshift(newSession);
        selectedSession.value = newSession;
      }

      await loadSessions();
    } else {
      notifyError(response.error || 'Error al enviar mensaje');
    }
  } catch (error) {
    notifyError('Error de conexión al enviar mensaje');
    // Eliminar mensaje temporal en caso de error
    messages.value = messages.value.filter(m => m.ulid !== tempMessage.ulid);
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const autoResize = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  target.style.height = 'auto';
  target.style.height = target.scrollHeight + 'px';
};

const getLastMessage = (session: ChatSession): string => {
  if (!session.messages || session.messages.length === 0) {
    return 'Sin mensajes';
  }
  const lastMsg = session.messages[session.messages.length - 1];
  return lastMsg.content.slice(0, 50) + '...';
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  return date.toLocaleDateString();
};

const hasUnread = (session: ChatSession): boolean => {
  return (unreadCounts.value[session.ulid] || 0) > 0;
};

const getUnreadCount = (session: ChatSession): number => {
  return unreadCounts.value[session.ulid] || 0;
};

const openLatestChat = () => {
  if (sessions.value.length > 0) {
    selectSession(sessions.value[0]);
  }
  showNotification.value = false;
};

const dismissNotification = () => {
  showNotification.value = false;
};

// Simular notificación de nuevo mensaje (en producción, usar WebSocket)
const simulateNotification = () => {
  if (!document.hasFocus()) {
    showNotification.value = true;
    if (sessions.value.length > 0) {
      unreadCounts.value[sessions.value[0].ulid] = (unreadCounts.value[sessions.value[0].ulid] || 0) + 1;
    }
  }
};

onMounted(() => {
  loadSessions();
  // En producción, usar WebSocket para notificaciones en tiempo real
  window.addEventListener('focus', () => {
    showNotification.value = false;
  });
});

watch(selectedSession, async () => {
  if (selectedSession.value) {
    await scrollToBottom();
  }
});
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.chat-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.new-chat-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #2563eb;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: #eff6ff;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.contact-item:hover {
  background: #f9fafb;
}

.contact-item.active {
  background: #eff6ff;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  margin-right: 12px;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.contact-last-message {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.contact-time {
  font-size: 11px;
  color: #9ca3af;
}

.unread-badge {
  background: #dc2626;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.chat-messages-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.chat-window-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-window-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.close-chat-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-chat-btn:hover {
  background: #f3f4f6;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-user {
  align-self: flex-end;
}

.message-user .message-content {
  background: #2563eb;
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message-assistant {
  align-self: flex-start;
}

.message-assistant .message-content {
  background: #f3f4f6;
  color: #1f2937;
  border-radius: 18px 18px 18px 4px;
}

.message-content {
  padding: 12px 16px;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  align-self: flex-end;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.message-input-area {
  padding: 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 120px;
}

.message-input:focus {
  border-color: #2563eb;
}

.send-btn {
  background: #2563eb;
  border: none;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.send-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.chat-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #6b7280;
}

.empty-icon {
  color: #d1d5db;
}

.chat-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
  font-weight: 500;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.notification-close:hover {
  background: #f3f4f6;
}
</style>
