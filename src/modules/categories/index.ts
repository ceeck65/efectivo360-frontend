/**
 * @fileoverview Entry point del módulo Categories
 * @module @modules/categories
 * 
 * Módulo para gestión de categorías jerárquicas con blueprints.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  CategoryNode,
  CategoryParentOption,
  BlueprintOption,
  CategoryCreateData,
  CategoryUpdateData,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchBlueprints,
} from './services/categories.service';

// =============================================================================
// ROUTER
// =============================================================================

export {
  categoriesRoutes,
  categoriesRouteNames,
  categoriesPaths,
  CATEGORIES_ROUTE_PREFIX,
  CATEGORIES_ROUTE_NAME,
} from './router';
