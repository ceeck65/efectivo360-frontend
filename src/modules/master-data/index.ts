/**
 * @fileoverview Punto de entrada público del módulo Master Data (Jerarquía con Blueprints)
 * @module @modules/master-data
 * 
 * Implementación de jerarquía de Categorías y Subcategorías basada en Blueprints.
 * Soporta atributos dinámicos según el tipo de categoría.
 * 
 * Características:
 * - Jerarquía recursiva: Categoría → Subcategoría → ...
 * - Blueprints con atributos dinámicos (ej: Zapatos → tallas/colores)
 * - Entidades con atributos personalizados
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Blueprint types
  Blueprint,
  BlueprintAttribute,
  BlueprintAttributeType,
  BlueprintAttributeConfig,
  BlueprintAttributeOption,
  BlueprintValidationRule,
  
  // Category types
  Category,
  CategoryTree,
  CategoryDetail,
  
  // Entity types
  DynamicEntity,
  DynamicAttributeValue,
  DynamicAttributeFilter,
  
  // Filter types
  CategoryFilters,
  DynamicEntityFilters,
  
  // Form types
  CategoryFormData,
  BlueprintFormData,
  
  // UI types
  TreeNode,
  HierarchyColumn,
  
  // API types
  CategoryTreeResponse,
  MoveCategoryResponse,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Blueprints
  fetchBlueprints,
  fetchBlueprintById,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  cloneBlueprint,
  
  // Categories
  fetchCategoryTree,
  fetchCategoriesByLevel,
  fetchCategoryById,
  fetchCategoryByCode,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Hierarchy
  moveCategory,
  reorderCategories,
  expandCategory,
  getCategoryPath,
  
  // Dynamic entities
  searchDynamicEntities,
  fetchDynamicEntityById,
  saveDynamicAttributes,
  
  // Validation
  validateAgainstBlueprint,
  checkCategoryCodeAvailability,
} from './services/masterData.service';

// =============================================================================
// STORE
// =============================================================================

export { useMasterDataStore } from './stores/masterDataStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  useMasterData,
  useCategorySelector,
  useDynamicAttributes,
} from './composables/useMasterData';
