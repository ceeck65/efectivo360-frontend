/**
 * @fileoverview Punto de entrada público del módulo Assistant (Efi)
 * @module @modules/assistant
 * 
 * Asistente de IA con contexto inteligente.
 * 
 * Características:
 * - Conversaciones con contexto persistente
 * - Integración con módulos (Inventory, Payments, Sales, etc.)
 * - Streaming de respuestas vía WebSocket
 * - Sugerencias contextuales según el módulo activo
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Message types
  Message,
  MessageRole,
  MessageStatus,
  ChatSession,
  
  // Context types
  ModuleContext,
  ContextModule,
  ContextSnapshot,
  ConversationContext,
  
  // API types
  AIPayload,
  AIResponse,
  ChatEndpointResponse,
  
  // UI types
  PromptSuggestion,
  EfiConfig,
  
  // Store types
  AssistantState,
  SessionFilters,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Sessions
  fetchSessions,
  fetchSessionById,
  createSession,
  updateSession,
  deleteSession,
  
  // Messages & Chat
  sendMessageToAI,
  fetchSessionMessages,
  regenerateResponse,
  
  // RAG & Knowledge
  searchKnowledge,
  fetchContextualSuggestions,
  
  // Streaming
  createStreamingConnection,
} from './services/assistant.service';

// =============================================================================
// STORE
// =============================================================================

export { useAssistantStore } from './stores/assistantStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  useEfi,
  useEfiQuick,
} from './composables/useEfi';

// =============================================================================
// COMPONENTS (Componentes auto-registrados globalmente)
// =============================================================================

export { default as EfiChatBubble } from './components/EfiChatBubble.vue';
export { default as EfiChatWindow } from './components/EfiChatWindow.vue';
