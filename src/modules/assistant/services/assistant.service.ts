/**
 * @fileoverview Servicio de API para Assistant (Efi)
 * @module @modules/assistant/services/assistant.service
 * 
 * Gestión de peticiones a los endpoints de IA/RAG de Django.
 * Incluye manejo de sesiones, mensajes y contexto.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse } from '@core/types';
import type {
  Message,
  ChatSession,
  AIPayload,
  AIResponse,
  ChatEndpointResponse,
  ContextSnapshot,
  SessionFilters,
} from '../types';

const BASE_URL = '/assistant';

// =============================================================================
// SESSIONS
// =============================================================================

/**
 * Obtener todas las sesiones del usuario
 */
export async function fetchSessions(filters?: SessionFilters): Promise<ChatSession[]> {
  const response = await httpClient.get<ChatEndpointResponse>(
    `${BASE_URL}/sessions/`,
    { params: filters }
  );
  return response.data.sessions || [];
}

/**
 * Obtener una sesión específica con sus mensajes
 */
export async function fetchSessionById(sessionId: string): Promise<{ session: ChatSession | null; messages: Message[] }> {
  const response = await httpClient.get<ChatEndpointResponse>(
    `${BASE_URL}/sessions/${sessionId}/`
  );
  return {
    session: response.data.session || null,
    messages: response.data.messages || [],
  };
}

/**
 * Crear nueva sesión de chat
 */
export async function createSession(
  title: string = 'Nueva conversación',
  context?: ContextSnapshot
): Promise<ChatSession | null> {
  const response = await httpClient.post<ChatEndpointResponse>(
    `${BASE_URL}/sessions/`,
    { title, context_snapshot: context }
  );
  return response.data.session || null;
}

/**
 * Actualizar sesión (título, contexto)
 */
export async function updateSession(
  sessionId: string,
  data: Partial<{ title: string; is_active: boolean; context_snapshot: ContextSnapshot }>
): Promise<ChatSession | null> {
  const response = await httpClient.patch<ChatEndpointResponse>(
    `${BASE_URL}/sessions/${sessionId}/`,
    data
  );
  return response.data.session || null;
}

/**
 * Eliminar sesión
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await httpClient.delete(`${BASE_URL}/sessions/${sessionId}/`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// MESSAGES & CHAT
// =============================================================================

/**
 * Enviar mensaje a Efi (endpoint principal)
 * Incluye contexto inteligente opcional
 */
export async function sendMessageToAI(payload: AIPayload): Promise<AIResponse> {
  const response = await httpClient.post<AIResponse>(
    `${BASE_URL}/chat/`,
    {
      message: payload.message,
      session_id: payload.sessionId,
      context: payload.context,
      options: payload.options,
    }
  );
  return response.data;
}

/**
 * Obtener mensajes de una sesión
 */
export async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const response = await httpClient.get<ChatEndpointResponse>(
    `${BASE_URL}/sessions/${sessionId}/messages/`
  );
  return response.data.messages || [];
}

/**
 * Regenerar respuesta del último mensaje
 */
export async function regenerateResponse(sessionId: string): Promise<AIResponse | null> {
  const response = await httpClient.post<AIResponse>(
    `${BASE_URL}/sessions/${sessionId}/regenerate/`
  );
  return response.data || null;
}

// =============================================================================
// RAG & KNOWLEDGE
// =============================================================================

/**
 * Buscar en la base de conocimiento
 * Útil para mostrar documentos relacionados
 */
export async function searchKnowledge(
  query: string,
  module?: string,
  limit: number = 5
): Promise<Array<{ title: string; content: string; source: string; score: number }>> {
  const response = await httpClient.post<ApiResponse<Array<{ title: string; content: string; source: string; score: number }>>>(
    `${BASE_URL}/knowledge/search/`,
    { query, module, limit }
  );
  return response.data.data || [];
}

/**
 * Obtener sugerencias contextuales basadas en el módulo actual
 */
export async function fetchContextualSuggestions(
  module: string,
  action?: string
): Promise<Array<{ label: string; prompt: string }>> {
  const response = await httpClient.get<ApiResponse<Array<{ label: string; prompt: string }>>>(
    `${BASE_URL}/suggestions/`,
    { params: { module, action } }
  );
  return response.data.data || [];
}

// =============================================================================
// STREAMING (WebSocket / SSE)
// =============================================================================

/**
 * Crear conexión WebSocket para streaming de respuestas
 * Retorna la URL del WebSocket para conectar
 */
export function createStreamingConnection(
  sessionId: string,
  onMessage: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): WebSocket | null {
  const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}${BASE_URL}/ws/chat/${sessionId}/`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'chunk') {
      onMessage(data.content);
    } else if (data.type === 'complete') {
      onComplete();
    } else if (data.type === 'error') {
      onError(data.error);
    }
  };
  
  ws.onerror = () => {
    onError('Error de conexión');
  };
  
  return ws;
}
