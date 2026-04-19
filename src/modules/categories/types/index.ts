/**
 * @fileoverview Tipos del módulo Categories (Gestión de Categorías y Subcategorías)
 * @module @modules/categories/types
 * 
 * Gestión de categorías jerárquicas con blueprints y herencia de atributos.
 */

// =============================================================================
// CATEGORY TYPES
// =============================================================================

/**
 * Nodo de categoría con estructura jerárquica
 */
export interface CategoryNode {
  id: number;
  nombre: string;
  slug: string;
  code: string;
  icono: string;
  blueprint_id: number | null;
  children: CategoryNode[];
}

/**
 * Opción de categoría para selector de padre
 */
export interface CategoryParentOption {
  id: number;
  label: string;
}

/**
 * Blueprint asociado a categoría
 */
export interface BlueprintOption {
  id: number;
  name: string;
  code: string;
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Datos para crear categoría
 */
export interface CategoryCreateData {
  nombre: string;
  icon?: string;
  parent_id?: number;
  industry_blueprint_id?: number;
}

/**
 * Datos para actualizar categoría
 */
export interface CategoryUpdateData {
  nombre: string;
  icon?: string;
  industry_blueprint_id?: number | null;
}
