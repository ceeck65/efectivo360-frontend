/**
 * @fileoverview Store de Pinia para Assistant (Efi)
 * @module @modules/assistant/stores/assistantStore
 * 
 * Estado reactivo de la conversación y el historial.
 * Maneja sesiones, mensajes y contexto inteligente.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type {
  Message,
  ChatSession,
  ContextSnapshot,
  ModuleContext,
  SessionFilters,
} from '../types';
import * as assistantService from '../services/assistant.service';

// Storage keys
const STORAGE_KEY = 'efi_session_id';
const STORAGE_MESSAGES = 'efi_messages';

export const useAssistantStore = defineStore('assistant', () => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  // Sesión actual
  const currentSession = ref<ChatSession | null>(null);
  const messages = ref<Message[]>([]);
  
  // Historial
  const sessions = ref<ChatSession[]>([]);
  
  // UI State
  const isOpen = ref(false);
  const isLoading = ref(false);
  const isTyping = ref(false);
  const error = ref<string | null>(null);
  
  // Contexto inteligente
  const activeContext = ref<ModuleContext | null>(null);

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  const sessionId = computed(() => currentSession.value?.id || null);
  
  const hasActiveSession = computed(() => !!currentSession.value?.isActive);
  
  const messageCount = computed(() => messages.value.length);
  
  const lastMessage = computed(() => 
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  );
  
  const userMessages = computed(() => 
    messages.value.filter(m => m.role === 'user')
  );
  
  const assistantMessages = computed(() => 
    messages.value.filter(m => m.role === 'assistant')
  );

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Cargar sesión almacenada desde localStorage
   */
  async function loadStoredSession(): Promise<boolean> {
    const storedId = localStorage.getItem(STORAGE_KEY);
    const storedMessages = localStorage.getItem(STORAGE_MESSAGES);

    // Restaurar mensajes
    if (storedMessages) {
      try {
        messages.value = JSON.parse(storedMessages);
      } catch (e) {
        messages.value = [];
      }
    }

    // Verificar sesión en backend
    if (storedId) {
      try {
        const { session, messages: serverMessages } = await assistantService.fetchSessionById(storedId);
        
        if (session) {
          currentSession.value = session;
          if (serverMessages.length > 0) {
            messages.value = serverMessages;
            persistMessages();
          }
          return true;
        }
      } catch (e) {
        console.log('Sesión no encontrada en backend');
        clearStorage();
      }
    }

    return false;
  }

  /**
   * Crear nueva sesión
   */
  async function createNewSession(title?: string): Promise<void> {
    // Guardar sesión anterior al historial si existe
    if (currentSession.value && messages.value.length > 0) {
      sessions.value.unshift(currentSession.value);
    }

    clearStorage();
    
    const context = activeContext.value 
      ? buildContextSnapshot(activeContext.value)
      : undefined;
      
    const newSession = await assistantService.createSession(title, context);
    
    if (newSession) {
      currentSession.value = newSession;
      localStorage.setItem(STORAGE_KEY, newSession.id);
      messages.value = [];
    }
  }

  /**
   * Cargar sesión específica
   */
  async function loadSession(sessionId: string): Promise<boolean> {
    try {
      const { session, messages: sessionMessages } = await assistantService.fetchSessionById(sessionId);
      
      if (session) {
        currentSession.value = session;
        messages.value = sessionMessages;
        localStorage.setItem(STORAGE_KEY, sessionId);
        persistMessages();
        return true;
      }
    } catch (e) {
      toast.error('Error cargando sesión');
    }
    
    return false;
  }

  /**
   * Cargar lista de sesiones del usuario
   */
  async function loadSessions(filters?: SessionFilters): Promise<void> {
    try {
      sessions.value = await assistantService.fetchSessions(filters);
    } catch (e) {
      console.error('Error cargando sesiones:', e);
    }
  }

  /**
   * Cerrar sesión actual
   */
  function closeSession(): void {
    currentSession.value = null;
    messages.value = [];
    clearStorage();
  }

  // ==========================================================================
  // MESSAGES
  // ==========================================================================

  /**
   * Añadir mensaje al estado local
   */
  function addMessage(message: Message): void {
    messages.value.push(message);
    persistMessages();
  }

  /**
   * Actualizar mensaje existente
   */
  function updateMessage(messageId: string, updates: Partial<Message>): void {
    const index = messages.value.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], ...updates };
      persistMessages();
    }
  }

  /**
   * Eliminar mensaje
   */
  function removeMessage(messageId: string): void {
    messages.value = messages.value.filter(m => m.id !== messageId);
    persistMessages();
  }

  // ==========================================================================
  // CONTEXT MANAGEMENT
  // ==========================================================================

  /**
   * Establecer contexto desde otro módulo
   */
  function setContext(context: ModuleContext): void {
    activeContext.value = context;
    
    // Actualizar snapshot de sesión si existe
    if (currentSession.value) {
      currentSession.value.contextSnapshot = buildContextSnapshot(context);
    }
  }

  /**
   * Limpiar contexto activo
   */
  function clearContext(): void {
    activeContext.value = null;
  }

  /**
   * Construir snapshot de contexto
   */
  function buildContextSnapshot(context: ModuleContext): ContextSnapshot {
    const history = currentSession.value?.contextSnapshot?.history || [];
    
    return {
      currentModule: context.module,
      moduleData: context.data,
      history: [...history, context].slice(-10), // Mantener últimos 10
      userPreferences: {
        language: 'es',
        format: 'detailed',
      },
    };
  }

  // ==========================================================================
  // UI STATE
  // ==========================================================================

  function openChat(): void {
    isOpen.value = true;
  }

  function closeChat(): void {
    isOpen.value = false;
  }

  function toggleChat(): void {
    isOpen.value = !isOpen.value;
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  function persistMessages(): void {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages.value));
  }

  function clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_MESSAGES);
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    currentSession,
    messages,
    sessions,
    isOpen,
    isLoading,
    isTyping,
    error,
    activeContext,
    
    // Getters
    sessionId,
    hasActiveSession,
    messageCount,
    lastMessage,
    userMessages,
    assistantMessages,
    
    // Session
    loadStoredSession,
    createNewSession,
    loadSession,
    loadSessions,
    closeSession,
    
    // Messages
    addMessage,
    updateMessage,
    removeMessage,
    
    // Context
    setContext,
    clearContext,
    buildContextSnapshot,
    
    // UI
    openChat,
    closeChat,
    toggleChat,
    
    // Storage
    persistMessages,
    clearStorage,
  };
});
