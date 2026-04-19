/**
 * @fileoverview Servicio de API para Chat
 * @module @modules/chat/services/chat
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse } from '@core/types';
import type { ChatMessage, ChatSession, ChatResponse } from '../types';

const BASE_URL = '/api/v1/efi';

/**
 * Enviar mensaje al chat
 */
export async function sendMessage(message: string, sessionUlid?: string): Promise<ChatResponse> {
  const response = await httpClient.post<ChatResponse>(
    `${BASE_URL}/chat/`,
    {
      message,
      session_ulid: sessionUlid || undefined,
    }
  );
  return response.data;
}

/**
 * Obtener sesiones de chat del usuario
 */
export async function fetchChatSessions(): Promise<ChatSession[]> {
  const response = await httpClient.get<ApiResponse<{ sessions: ChatSession[] }>>(
    `${BASE_URL}/sessions/`
  );
  return response.data.data?.sessions ?? [];
}

/**
 * Obtener detalle de una sesión de chat
 */
export async function fetchChatSession(sessionUlid: string): Promise<ChatSession | null> {
  const response = await httpClient.get<ApiResponse<{ session: ChatSession }>>(
    `${BASE_URL}/sessions/${sessionUlid}/`
  );
  return response.data.data?.session || null;
}
