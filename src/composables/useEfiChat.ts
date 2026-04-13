/**
 * @deprecated Este archivo está marcado para eliminación.
 * Usar el nuevo módulo HMVC: import { useEfi, useAssistantStore } from '@modules/assistant'
 * 
 * COMPOSABLE LEGACY: useEfiChat
 * 
 * Este composable ha sido migrado al módulo @modules/assistant siguiendo el patrón HMVC.
 * 
 * TODO: Eliminar este archivo después de migrar todas las referencias al nuevo módulo.
 */

import { ref, computed } from 'vue';
import { apiClient } from './useApi';

// Types (legacy - usar types desde @modules/assistant)
export interface EfiMessage {
  ulid: string;
  session_ulid: string;
  tenant_ulid: string;
  user_ulid: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_used?: Record<string, any>;
  tokens_input?: number;
  tokens_output?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EfiChatSession {
  ulid: string;
  tenant_ulid: string;
  user_ulid: string;
  title: string;
  context_snapshot?: Record<string, any>;
  is_active: boolean;
  messages?: EfiMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  success: boolean;
  session_ulid: string;
  message_ulid: string;
  user_message_ulid: string;
  response: string;
  context_used?: Record<string, any>;
  error?: string;
}

// Composable
export function useEfiChat() {
  const isLoading = ref(false);
  const isTyping = ref(false);
  const error = ref<string | null>(null);
  const currentSession = ref<EfiChatSession | null>(null);
  const messages = ref<EfiMessage[]>([]);

  const sessionUlid = computed(() => currentSession.value?.ulid || null);
  const hasActiveSession = computed(() => !!currentSession.value?.is_active);

  // Load session from localStorage on init
  const loadStoredSession = async (): Promise<boolean> => {
    const storedSessionUlid = localStorage.getItem('efi_session_ulid');
    const storedMessages = localStorage.getItem('efi_messages');

    if (storedMessages) {
      try {
        messages.value = JSON.parse(storedMessages);
      } catch (e) {
        console.error('Error loading stored messages:', e);
        messages.value = [];
      }
    }

    if (storedSessionUlid) {
      try {
        const response = await apiClient.get(`/api/v1/efi/sessions/${storedSessionUlid}/`);
        if (response.data.success) {
          currentSession.value = response.data.session;
          if (response.data.session?.messages) {
            messages.value = response.data.session.messages;
            saveMessages();
          }
          return true;
        }
      } catch (e) {
        console.log('Session not found on backend, clearing stored session');
        clearStoredSession();
      }
    }

    return false;
  };

  // Save messages to localStorage
  const saveMessages = () => {
    localStorage.setItem('efi_messages', JSON.stringify(messages.value));
  };

  // Clear stored session
  const clearStoredSession = () => {
    localStorage.removeItem('efi_session_ulid');
    localStorage.removeItem('efi_messages');
    currentSession.value = null;
    messages.value = [];
  };

  // Fetch user's sessions
  const fetchSessions = async (): Promise<EfiChatSession[]> => {
    try {
      const response = await apiClient.get('/api/v1/efi/sessions/');
      return response.data.sessions || [];
    } catch (e) {
      console.error('Error fetching sessions:', e);
      return [];
    }
  };

  // Start new chat session
  const startNewSession = async (): Promise<void> => {
    // Save current session to history if exists
    if (currentSession.value && messages.value.length > 0) {
      const sessions = JSON.parse(localStorage.getItem('efi_sessions_history') || '[]');
      sessions.unshift({
        ulid: currentSession.value.ulid,
        title: currentSession.value.title || 'Conversación sin título',
        created_at: currentSession.value.created_at,
        message_count: messages.value.length,
      });
      localStorage.setItem('efi_sessions_history', JSON.stringify(sessions.slice(0, 10)));
    }

    clearStoredSession();
  };

  // Send message to Efi
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!content.trim() || isLoading.value || isTyping.value) return false;

    isLoading.value = true;
    isTyping.value = true;
    error.value = null;

    // Add user message immediately to UI
    const tempUserMessage: EfiMessage = {
      ulid: `temp-${Date.now()}`,
      session_ulid: sessionUlid.value || '',
      tenant_ulid: currentSession.value?.tenant_ulid || '',
      user_ulid: currentSession.value?.user_ulid || '',
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    messages.value.push(tempUserMessage);
    saveMessages();

    try {
      const response = await apiClient.post<ChatResponse>('/v1/efi/chat/', {
        message: content.trim(),
        session_ulid: sessionUlid.value,
      });

      const data = response.data;

      if (data.success) {
        // Update session if new
        if (data.session_ulid) {
          localStorage.setItem('efi_session_ulid', data.session_ulid);
          if (!currentSession.value) {
            currentSession.value = {
              ulid: data.session_ulid,
              tenant_ulid: '',
              user_ulid: '',
              title: content.slice(0, 30) + '...',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        }

        // Add Efi's response
        const assistantMessage: EfiMessage = {
          ulid: data.message_ulid,
          session_ulid: data.session_ulid,
          tenant_ulid: currentSession.value?.tenant_ulid || '',
          user_ulid: currentSession.value?.user_ulid || '',
          role: 'assistant',
          content: data.response,
          context_used: data.context_used,
          created_at: new Date().toISOString(),
        };
        messages.value.push(assistantMessage);
        saveMessages();

        return true;
      } else {
        error.value = data.error || 'Error desconocido';
        // Add error message
        messages.value.push({
          ulid: `error-${Date.now()}`,
          session_ulid: sessionUlid.value || '',
          tenant_ulid: currentSession.value?.tenant_ulid || '',
          user_ulid: currentSession.value?.user_ulid || '',
          role: 'assistant',
          content: `❌ ${data.error || 'Lo siento, no pude procesar tu mensaje.'}`,
          created_at: new Date().toISOString(),
        });
        saveMessages();
        return false;
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      error.value = err.message || 'Error de conexión';
      messages.value.push({
        ulid: `error-${Date.now()}`,
        session_ulid: sessionUlid.value || '',
        tenant_ulid: currentSession.value?.tenant_ulid || '',
        user_ulid: currentSession.value?.user_ulid || '',
        role: 'assistant',
        content: '❌ Error de conexión. Por favor, verifica tu conexión a internet.',
        created_at: new Date().toISOString(),
      });
      saveMessages();
      return false;
    } finally {
      isLoading.value = false;
      isTyping.value = false;
    }
  };

  // Load specific session
  const loadSession = async (sessionUlid: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/api/v1/efi/sessions/${sessionUlid}/`);
      if (response.data.success) {
        currentSession.value = response.data.session;
        messages.value = response.data.session.messages || [];
        localStorage.setItem('efi_session_ulid', sessionUlid);
        saveMessages();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error loading session:', e);
      return false;
    }
  };

  return {
    // State
    isLoading: computed(() => isLoading.value),
    isTyping: computed(() => isTyping.value),
    error: computed(() => error.value),
    messages: computed(() => messages.value),
    currentSession: computed(() => currentSession.value),
    sessionUlid,
    hasActiveSession,

    // Methods
    loadStoredSession,
    fetchSessions,
    startNewSession,
    sendMessage,
    loadSession,
    clearStoredSession,
    saveMessages,
  };
}
