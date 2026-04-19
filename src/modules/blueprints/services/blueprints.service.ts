/**
 * @fileoverview Servicio de API para Blueprints (Tipos de Comercio)
 * @module @modules/blueprints/services/blueprints.service
 * 
 * Gestión de blueprints de industria con configuración de negocio,
 * schema de productos y grupos de atributos.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse } from '@core/types';
import type {
  Blueprint,
  BlueprintCreateData,
  BlueprintUpdateData,
  SchemaGroupsUpdateData,
} from '../types';

const BASE_URL = '/api/v1/industry-blueprints';

// =============================================================================
// BLUEPRINTS
// =============================================================================

/**
 * Obtener todos los blueprints
 */
export async function fetchBlueprints(): Promise<Blueprint[]> {
  const response = await httpClient.get<ApiResponse<Blueprint[]> | ApiResponse<{ results: Blueprint[] }>>(
    BASE_URL
  );
  const data = response.data.data;
  return Array.isArray(data) ? data : (data as { results?: Blueprint[] }).results ?? [];
}

/**
 * Obtener blueprint por ID
 */
export async function fetchBlueprintById(id: number): Promise<Blueprint | null> {
  const response = await httpClient.get<ApiResponse<Blueprint>>(
    `${BASE_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Crear blueprint
 */
export async function createBlueprint(data: BlueprintCreateData): Promise<Blueprint | null> {
  const response = await httpClient.post<ApiResponse<Blueprint>>(
    BASE_URL,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar blueprint
 */
export async function updateBlueprint(
  id: number,
  data: BlueprintUpdateData
): Promise<Blueprint | null> {
  const response = await httpClient.patch<ApiResponse<Blueprint>>(
    `${BASE_URL}/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Eliminar blueprint
 */
export async function deleteBlueprint(id: number): Promise<boolean> {
  try {
    await httpClient.delete(`${BASE_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// SCHEMA GROUPS
// =============================================================================

/**
 * Obtener grupos de schema_logic de un blueprint
 */
export async function fetchSchemaGroups(id: number): Promise<{ schema_logic: { grupos: Record<string, unknown> } } | null> {
  const response = await httpClient.get<ApiResponse<{ schema_logic: { grupos: Record<string, unknown> } }>>(
    `${BASE_URL}/${id}/schema-groups/`
  );
  return response.data.data || null;
}

/**
 * Actualizar grupos de schema_logic de un blueprint
 */
export async function updateSchemaGroups(
  id: number,
  data: SchemaGroupsUpdateData
): Promise<boolean> {
  try {
    await httpClient.patch(`${BASE_URL}/${id}/schema-groups/`, data);
    return true;
  } catch {
    return false;
  }
}
