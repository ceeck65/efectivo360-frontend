/**
 * @fileoverview Router del módulo Categories
 * @module @modules/categories/router
 */

import { defineAsyncComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

const CategoriesManagementView = defineAsyncComponent(
  () => import('./views/CategoriesManagementView.vue')
);

// =============================================================================
// ROUTE CONSTANTS
// =============================================================================

export const CATEGORIES_ROUTE_PREFIX = '/admin/master/categories';
export const CATEGORIES_ROUTE_NAME = 'admin.master.categories';

// =============================================================================
// ROUTE NAMES
// =============================================================================

export const categoriesRouteNames = {
  list: `${CATEGORIES_ROUTE_NAME}.list`,
} as const;

// =============================================================================
// ROUTE PATHS HELPER
// =============================================================================

export const categoriesPaths = {
  list: () => CATEGORIES_ROUTE_PREFIX,
} as const;

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

export const categoriesRoutes: RouteRecordRaw[] = [
  {
    path: CATEGORIES_ROUTE_PREFIX,
    name: CATEGORIES_ROUTE_NAME,
    redirect: () => categoriesPaths.list(),
    meta: {
      requiresAuth: true,
      requiresStaff: true,
      module: 'categories',
      icon: 'Waypoints',
      breadcrumb: 'Categorías',
    },
    children: [
      {
        path: '',
        name: categoriesRouteNames.list,
        component: CategoriesManagementView,
        meta: {
          title: 'Gestión de Categorías',
          breadcrumb: 'Categorías',
          requiresStaff: true,
        },
      },
    ],
  },
];
