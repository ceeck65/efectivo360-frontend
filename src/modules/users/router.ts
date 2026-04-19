/**
 * @fileoverview Router del módulo Users
 * @module @modules/users/router
 */

import { defineAsyncComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

const StaffUsersView = defineAsyncComponent(
  () => import('./views/StaffUsersView.vue')
);

const TenantUsersView = defineAsyncComponent(
  () => import('./views/TenantUsersView.vue')
);

// =============================================================================
// ROUTE CONSTANTS
// =============================================================================

export const USERS_ROUTE_PREFIX = '/admin/users';
export const USERS_ROUTE_NAME = 'admin.users';

// =============================================================================
// ROUTE NAMES
// =============================================================================

export const usersRouteNames = {
  staffList: `${USERS_ROUTE_NAME}.staff.list`,
  tenantList: `${USERS_ROUTE_NAME}.tenant.list`,
} as const;

// =============================================================================
// ROUTE PATHS HELPER
// =============================================================================

export const usersPaths = {
  staffList: () => USERS_ROUTE_PREFIX,
  tenantList: () => '/admin/tenant/users',
} as const;

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

export const usersRoutes: RouteRecordRaw[] = [
  // Staff Users - ERP users management
  {
    path: USERS_ROUTE_PREFIX,
    name: USERS_ROUTE_NAME,
    redirect: () => usersPaths.staffList(),
    meta: {
      requiresAuth: true,
      requiresStaff: true,
      module: 'users',
      icon: 'Users',
      breadcrumb: 'Usuarios Staff',
    },
    children: [
      {
        path: '',
        name: usersRouteNames.staffList,
        component: StaffUsersView,
        meta: {
          title: 'Gestión de Usuarios ERP',
          breadcrumb: 'Usuarios ERP',
          requiresStaff: true,
        },
      },
    ],
  },
  // Tenant Users - Store users management
  {
    path: '/admin/tenant/users',
    name: 'admin.tenant.users',
    component: TenantUsersView,
    meta: {
      title: 'Gestión de Usuarios de Tienda',
      breadcrumb: 'Usuarios Tienda',
      requiresAuth: true,
    },
  },
];
