/**
 * @fileoverview Servicio de API para BusinessTypes (Tipos de Comercio)
 * @module @modules/blueprints/services/blueprints.service
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse } from '@core/types';
import type {
  Blueprint,
  BlueprintCreateData,
  BlueprintUpdateData,
} from '../types';

const BASE_URL = '/api/v1/business-types';

// =============================================================================
// BUSINESS TYPES
// =============================================================================

/**
 * Obtener todos los business types
 */
export async function fetchBlueprints(): Promise<Blueprint[]> {
  const response = await httpClient.get<ApiResponse<Blueprint[]> | ApiResponse<{ results: Blueprint[] }>>(
    BASE_URL
  );
  const data = response.data.data;
  return Array.isArray(data) ? data : (data as { results?: Blueprint[] }).results ?? [];
}

/**
 * Obtener business type por ID
 */
export async function fetchBlueprintById(id: string): Promise<Blueprint | null> {
  const response = await httpClient.get<ApiResponse<Blueprint>>(
    `${BASE_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Crear business type
 */
export async function createBlueprint(data: BlueprintCreateData): Promise<Blueprint | null> {
  const response = await httpClient.post<ApiResponse<Blueprint>>(
    BASE_URL,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar business type
 */
export async function updateBlueprint(
  id: string,
  data: BlueprintUpdateData
): Promise<Blueprint | null> {
  const response = await httpClient.patch<ApiResponse<Blueprint>>(
    `${BASE_URL}/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Eliminar business type
 */
export async function deleteBlueprint(id: string): Promise<boolean> {
  try {
    await httpClient.delete(`${BASE_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}
