/**
 * @fileoverview Servicio de API para Categories (Gestión de Categorías)
 * @module @modules/categories/services/categories.service
 * 
 * Gestión de categorías jerárquicas y blueprints.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse } from '@core/types';
import type {
  CategoryNode,
  CategoryCreateData,
  CategoryUpdateData,
  BlueprintOption,
} from '../types';

const BASE_URL = '/api/v1/global/categorias';
const BLUEPRINTS_URL = '/api/v1/industry-blueprints';

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * Obtener árbol de categorías
 */
export async function fetchCategories(): Promise<CategoryNode[]> {
  const response = await httpClient.get<ApiResponse<CategoryNode[]>>(
    BASE_URL
  );
  return response.data.data ?? [];
}

/**
 * Obtener categoría por ID
 */
export async function fetchCategoryById(id: number): Promise<CategoryNode | null> {
  const response = await httpClient.get<ApiResponse<CategoryNode>>(
    `${BASE_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Crear categoría
 */
export async function createCategory(data: CategoryCreateData): Promise<CategoryNode | null> {
  const response = await httpClient.post<ApiResponse<CategoryNode>>(
    BASE_URL,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar categoría
 */
export async function updateCategory(
  id: number,
  data: CategoryUpdateData
): Promise<CategoryNode | null> {
  const response = await httpClient.patch<ApiResponse<CategoryNode>>(
    `/api/v1/categories/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Eliminar categoría
 */
export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await httpClient.delete(`${BASE_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// BLUEPRINTS
// =============================================================================

/**
 * Obtener blueprints disponibles
 */
export async function fetchBlueprints(): Promise<BlueprintOption[]> {
  const response = await httpClient.get<ApiResponse<{ results: BlueprintOption[] }>>(
    BLUEPRINTS_URL
  );
  return response.data.data?.results ?? [];
}
