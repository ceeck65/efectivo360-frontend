/**
 * @fileoverview Tipos del módulo Assistant (Efi)
 * @module @modules/assistant/types
 * 
 * Define interfaces para mensajes, payload de IA y contexto de conversación.
 * Soporta contexto inteligente desde otros módulos.
 */

import type { ULID } from '@core/types';

// =============================================================================
// BASE MESSAGE TYPES
// =============================================================================

/**
 * Rol del mensaje en la conversación
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Estado del mensaje
 */
export type MessageStatus = 'pending' | 'sent' | 'error' | 'streaming';

/**
 * Mensaje individual en la conversación
 */
export interface Message {
  id: ULID;
  sessionId: ULID;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  
  // Contexto usado por la IA para generar respuesta
  contextUsed?: ContextSnapshot;
  
  // Metadatos de la IA
  tokensInput?: number;
  tokensOutput?: number;
  modelUsed?: string;
  processingTimeMs?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

/**
 * Sesión de chat con Efi
 */
export interface ChatSession {
  id: ULID;
  tenantId: ULID;
  userId: ULID;
  title: string;
  
  // Contexto capturado al inicio de la sesión
  contextSnapshot?: ContextSnapshot;
  
  // Estado
  isActive: boolean;
  messageCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONTEXT TYPES (Inteligencia de Contexto)
// =============================================================================

/**
 * Tipo de módulo que puede enviar contexto
 */
export type ContextModule = 
  | 'inventory' 
  | 'payments' 
  | 'sales' 
  | 'customers' 
  | 'reports'
  | 'dashboard'
  | 'settings';

/**
 * Datos contextuales desde otro módulo
 * Permite que Efi tenga conocimiento del estado actual de la UI
 */
export interface ModuleContext {
  module: ContextModule;
  action?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Snapshot completo del contexto para la IA
 */
export interface ContextSnapshot {
  // Módulo activo actual
  currentModule?: ContextModule;
  
  // Datos del módulo (ej: producto seleccionado, cliente actual)
  moduleData?: Record<string, unknown>;
  
  // Historial de contextos en esta sesión
  history?: ModuleContext[];
  
  // Preferencias del usuario para esta conversación
  userPreferences?: {
    language?: string;
    format?: 'detailed' | 'summary' | 'bullet';
  };
}

/**
 * Contexto de conversación para prompts dinámicos
 */
export interface ConversationContext {
  sessionId?: ULID;
  previousMessages?: Pick<Message, 'role' | 'content'>[];
  moduleContext?: ModuleContext;
  userIntent?: string;
}

// =============================================================================
// API PAYLOAD TYPES
// =============================================================================

/**
 * Payload para enviar mensaje a la IA
 */
export interface AIPayload {
  message: string;
  sessionId?: ULID;
  context?: ContextSnapshot;
  
  // Opciones de generación
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

/**
 * Respuesta de la IA
 */
export interface AIResponse {
  success: boolean;
  sessionId: ULID;
  messageId: ULID;
  userMessageId: ULID;
  content: string;
  contextUsed?: ContextSnapshot;
  error?: string;
  
  // Metadata
  tokensInput?: number;
  tokensOutput?: number;
  modelUsed?: string;
  processingTimeMs?: number;
}

/**
 * Respuesta del endpoint de chat
 */
export interface ChatEndpointResponse {
  success: boolean;
  session?: ChatSession;
  sessions?: ChatSession[];
  messages?: Message[];
  response?: string;
  error?: string;
}

// =============================================================================
// FORM & UI TYPES
// =============================================================================

/**
 * Sugerencia de prompt rápido
 */
export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  module?: ContextModule;
}

/**
 * Configuración del componente Efi
 */
export interface EfiConfig {
  position: 'bottom-right' | 'bottom-left';
  initialMessage?: string;
  suggestions?: PromptSuggestion[];
  theme: 'light' | 'dark' | 'auto';
}

// =============================================================================
// STORE STATE TYPES
// =============================================================================

/**
 * Estado del store de Efi
 */
export interface AssistantState {
  // Sesión actual
  currentSession: ChatSession | null;
  messages: Message[];
  
  // Historial
  sessions: ChatSession[];
  
  // UI State
  isOpen: boolean;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  
  // Contexto inteligente
  activeContext: ModuleContext | null;
}

/**
 * Filtros para historial de sesiones
 */
export interface SessionFilters {
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
