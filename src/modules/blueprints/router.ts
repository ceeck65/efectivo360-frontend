/**
 * @fileoverview Router del módulo Blueprints
 * @module @modules/blueprints/router
 */

import { defineAsyncComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

const BlueprintsManagementView = defineAsyncComponent(
  () => import('./views/BlueprintsManagementView.vue')
);

// =============================================================================
// ROUTE CONSTANTS
// =============================================================================

export const BLUEPRINTS_ROUTE_PREFIX = '/admin/master/commerce-types';
export const BLUEPRINTS_ROUTE_NAME = 'admin.master.commerce-types';

// =============================================================================
// ROUTE NAMES
// =============================================================================

export const blueprintsRouteNames = {
  list: `${BLUEPRINTS_ROUTE_NAME}.list`,
} as const;

// =============================================================================
// ROUTE PATHS HELPER
// =============================================================================

export const blueprintsPaths = {
  list: () => BLUEPRINTS_ROUTE_PREFIX,
} as const;

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

export const blueprintsRoutes: RouteRecordRaw[] = [
  {
    path: BLUEPRINTS_ROUTE_PREFIX,
    name: BLUEPRINTS_ROUTE_NAME,
    redirect: () => blueprintsPaths.list(),
    meta: {
      requiresAuth: true,
      requiresStaff: true,
      module: 'blueprints',
      icon: 'Building2',
      breadcrumb: 'Tipos de Comercio',
    },
    children: [
      {
        path: '',
        name: blueprintsRouteNames.list,
        component: BlueprintsManagementView,
        meta: {
          title: 'Gestión de Tipos de Comercio',
          breadcrumb: 'Tipos de Comercio',
          requiresStaff: true,
        },
      },
    ],
  },
];
