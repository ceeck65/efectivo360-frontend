/**
 * @fileoverview Tipos para el módulo de Chat
 * @module @modules/chat/types
 */

export interface ChatUser {
  ulid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: string;
}

export interface ChatMessage {
  ulid: string;
  session_ulid: string;
  tenant_ulid: string | null;
  user_ulid: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_used?: Record<string, unknown>;
  tokens_input?: number;
  tokens_output?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  isLoading?: boolean;
}

export interface ChatSession {
  ulid: string;
  tenant_ulid: string | null;
  user_ulid: string;
  title: string;
  context_snapshot?: Record<string, unknown>;
  is_active: boolean;
  messages?: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  success: boolean;
  session_ulid: string;
  message_ulid: string;
  user_message_ulid: string;
  response: string;
  context_used?: Record<string, unknown>;
  error?: string;
}

export interface UnreadCount {
  user_ulid: string;
  count: number;
}
