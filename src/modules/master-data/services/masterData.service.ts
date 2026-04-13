/**
 * @fileoverview Servicio de API para Master Data (Jerarquía con Blueprints)
 * @module @modules/master-data/services/masterData.service
 * 
 * Gestión de categorías jerárquicas y blueprints con atributos dinámicos.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse, PaginatedResponse } from '@core/types';
import type {
  Blueprint,
  Category,
  CategoryTree,
  CategoryDetail,
  CategoryFilters,
  CategoryFormData,
  BlueprintFormData,
  DynamicEntity,
  DynamicEntityFilters,
  CategoryTreeResponse,
  MoveCategoryResponse,
} from '../types';

const BASE_URL = '/master-data';
const CATEGORIES_URL = '/categories';
const BLUEPRINTS_URL = '/blueprints';

// =============================================================================
// BLUEPRINTS
// =============================================================================

/**
 * Obtener todos los blueprints
 */
export async function fetchBlueprints(): Promise<Blueprint[]> {
  const response = await httpClient.get<ApiResponse<Blueprint[]>>(
    `${BLUEPRINTS_URL}/`
  );
  return response.data.data || [];
}

/**
 * Obtener blueprint por ID
 */
export async function fetchBlueprintById(id: string): Promise<Blueprint | null> {
  const response = await httpClient.get<ApiResponse<Blueprint>>(
    `${BLUEPRINTS_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Crear blueprint
 */
export async function createBlueprint(data: BlueprintFormData): Promise<Blueprint | null> {
  const response = await httpClient.post<ApiResponse<Blueprint>>(
    `${BLUEPRINTS_URL}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar blueprint
 */
export async function updateBlueprint(
  id: string,
  data: Partial<BlueprintFormData>
): Promise<Blueprint | null> {
  const response = await httpClient.patch<ApiResponse<Blueprint>>(
    `${BLUEPRINTS_URL}/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Eliminar blueprint
 */
export async function deleteBlueprint(id: string): Promise<boolean> {
  try {
    await httpClient.delete(`${BLUEPRINTS_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clonar blueprint
 */
export async function cloneBlueprint(
  id: string,
  newCode: string,
  newName: string
): Promise<Blueprint | null> {
  const response = await httpClient.post<ApiResponse<Blueprint>>(
    `${BLUEPRINTS_URL}/${id}/clone/`,
    { code: newCode, name: newName }
  );
  return response.data.data || null;
}

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * Obtener árbol de categorías completo
 */
export async function fetchCategoryTree(
  filters?: CategoryFilters
): Promise<CategoryTreeResponse> {
  const response = await httpClient.get<ApiResponse<CategoryTreeResponse>>(
    `${CATEGORIES_URL}/tree/`,
    { params: filters }
  );
  return response.data.data || { tree: [], total: 0, maxLevel: 0 };
}

/**
 * Obtener categorías por nivel
 */
export async function fetchCategoriesByLevel(
  level: number = 0,
  parentId?: string | null
): Promise<Category[]> {
  const response = await httpClient.get<ApiResponse<Category[]>>(
    `${CATEGORIES_URL}/`,
    { params: { level, parent_id: parentId } }
  );
  return response.data.data || [];
}

/**
 * Obtener categoría por ID
 */
export async function fetchCategoryById(id: string): Promise<CategoryDetail | null> {
  const response = await httpClient.get<ApiResponse<CategoryDetail>>(
    `${CATEGORIES_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Obtener categoría por código
 */
export async function fetchCategoryByCode(code: string): Promise<Category | null> {
  const response = await httpClient.get<ApiResponse<Category>>(
    `${CATEGORIES_URL}/by-code/${code}/`
  );
  return response.data.data || null;
}

/**
 * Crear categoría
 */
export async function createCategory(data: CategoryFormData): Promise<Category | null> {
  const response = await httpClient.post<ApiResponse<Category>>(
    `${CATEGORIES_URL}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar categoría
 */
export async function updateCategory(
  id: string,
  data: Partial<CategoryFormData>
): Promise<Category | null> {
  const response = await httpClient.patch<ApiResponse<Category>>(
    `${CATEGORIES_URL}/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Eliminar categoría
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await httpClient.delete(`${CATEGORIES_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// HIERARCHY OPERATIONS
// =============================================================================

/**
 * Mover categoría en la jerarquía
 * Cambia el padre y recalcula el path y nivel
 */
export async function moveCategory(
  categoryId: string,
  newParentId: string | null,
  newSortOrder?: number
): Promise<MoveCategoryResponse> {
  const response = await httpClient.post<ApiResponse<MoveCategoryResponse>>(
    `${CATEGORIES_URL}/${categoryId}/move/`,
    { new_parent_id: newParentId, new_sort_order: newSortOrder }
  );
  return response.data.data || { success: false, newPath: '', newLevel: 0, affectedRows: 0 };
}

/**
 * Reordenar categorías
 */
export async function reorderCategories(
  categoryIds: string[]
): Promise<boolean> {
  try {
    await httpClient.post(`${CATEGORIES_URL}/reorder/`, { category_ids: categoryIds });
    return true;
  } catch {
    return false;
  }
}

/**
 * Expandir categoría (cargar hijos)
 */
export async function expandCategory(categoryId: string): Promise<Category[]> {
  const response = await httpClient.get<ApiResponse<Category[]>>(
    `${CATEGORIES_URL}/${categoryId}/children/`
  );
  return response.data.data || [];
}

/**
 * Obtener camino completo (breadcrumb)
 */
export async function getCategoryPath(categoryId: string): Promise<Category[]> {
  const response = await httpClient.get<ApiResponse<Category[]>>(
    `${CATEGORIES_URL}/${categoryId}/path/`
  );
  return response.data.data || [];
}

// =============================================================================
// DYNAMIC ENTITIES
// =============================================================================

/**
 * Buscar entidades con filtros dinámicos
 */
export async function searchDynamicEntities(
  filters: DynamicEntityFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<DynamicEntity>> {
  const response = await httpClient.post<ApiResponse<PaginatedResponse<DynamicEntity>>>(
    `${BASE_URL}/entities/search/`,
    { ...filters, page, page_size: pageSize }
  );
  return response.data.data || { count: 0, results: [], next: null, previous: null };
}

/**
 * Obtener entidad por ID con atributos dinámicos
 */
export async function fetchDynamicEntityById(
  entityType: string,
  id: string
): Promise<DynamicEntity | null> {
  const response = await httpClient.get<ApiResponse<DynamicEntity>>(
    `${BASE_URL}/entities/${entityType}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Guardar valores de atributos dinámicos
 */
export async function saveDynamicAttributes(
  entityType: string,
  entityId: string,
  attributeValues: Record<string, unknown>
): Promise<boolean> {
  try {
    await httpClient.patch(
      `${BASE_URL}/entities/${entityType}/${entityId}/attributes/`,
      { attribute_values: attributeValues }
    );
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validar valores contra blueprint
 */
export async function validateAgainstBlueprint(
  blueprintId: string,
  values: Record<string, unknown>
): Promise<{ valid: boolean; errors: Array<{ attribute: string; message: string }> }> {
  const response = await httpClient.post<ApiResponse<{ valid: boolean; errors: Array<{ attribute: string; message: string }> }>>(
    `${BLUEPRINTS_URL}/${blueprintId}/validate/`,
    { values }
  );
  return response.data.data || { valid: false, errors: [] };
}

/**
 * Verificar si código de categoría está disponible
 */
export async function checkCategoryCodeAvailability(
  code: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const response = await httpClient.get<ApiResponse<{ available: boolean }>>(
      `${CATEGORIES_URL}/check-code/`,
      { params: { code, exclude_id: excludeId } }
    );
    return response.data.data?.available || false;
  } catch {
    return false;
  }
}
