/**
 * @fileoverview Servicio de API para usuarios del chat
 * @module @modules/chat/services/users
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse } from '@core/types';
import type { ChatUser } from '../types';

const BASE_URL = '/api/v1/users';

/**
 * Obtener lista de usuarios del ERP (contactos)
 */
export async function fetchUsers(): Promise<ChatUser[]> {
  const response = await httpClient.get<ApiResponse<ChatUser[]>>(
    `${BASE_URL}/`
  );
  return response.data.data ?? [];
}

/**
 * Obtener usuario por ULID
 */
export async function fetchUserByUlid(ulid: string): Promise<ChatUser | null> {
  const response = await httpClient.get<ApiResponse<ChatUser>>(
    `${BASE_URL}/${ulid}/`
  );
  return response.data.data || null;
}
