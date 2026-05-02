/**
 * @fileoverview Router del módulo Vaults
 * @module @modules/vaults/router
 */

import { defineAsyncComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

const StaffBlueprintView = defineAsyncComponent(
  () => import('./views/StaffBlueprintView.vue')
);

const TenantVaultView = defineAsyncComponent(
  () => import('./views/TenantVaultView.vue')
);

// =============================================================================
// ROUTE CONSTANTS
// =============================================================================

export const VAULTS_ROUTE_PREFIX = '/vaults';
export const STAFF_BLUEPRINT_ROUTE_PREFIX = '/admin/staff/blueprint-vaults';
export const TENANT_VAULTS_ROUTE_PREFIX = '/my-vaults';

export const STAFF_BLUEPRINT_ROUTE_NAME = 'admin.staff.blueprint-vaults';
export const TENANT_VAULTS_ROUTE_NAME = 'tenant.vaults';

// =============================================================================
// ROUTE NAMES
// =============================================================================

export const vaultsRouteNames = {
  staffBlueprint: `${STAFF_BLUEPRINT_ROUTE_NAME}.list`,
  tenantVaults: `${TENANT_VAULTS_ROUTE_NAME}.list`,
} as const;

// =============================================================================
// ROUTE PATHS HELPER
// =============================================================================

export const vaultsPaths = {
  staffBlueprint: () => STAFF_BLUEPRINT_ROUTE_PREFIX,
  tenantVaults: () => TENANT_VAULTS_ROUTE_PREFIX,
} as const;

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

export const vaultsRoutes: RouteRecordRaw[] = [
  // Staff Blueprint Management
  {
    path: STAFF_BLUEPRINT_ROUTE_PREFIX,
    name: STAFF_BLUEPRINT_ROUTE_NAME,
    redirect: () => vaultsPaths.staffBlueprint(),
    meta: {
      requiresAuth: true,
      requiresStaff: true,
      module: 'vaults',
      icon: 'Archive',
      breadcrumb: 'Blueprint de Gaveteros',
      title: 'Blueprint de Gaveteros',
    },
    children: [
      {
        path: '',
        name: vaultsRouteNames.staffBlueprint,
        component: StaffBlueprintView,
        meta: {
          title: 'Blueprint de Gaveteros',
          breadcrumb: 'Blueprint de Gaveteros',
          requiresStaff: true,
          description: 'Gestiona las plantillas de gaveteros para todos los tenants',
        },
      },
    ],
  },
  // Tenant Vaults Management
  {
    path: TENANT_VAULTS_ROUTE_PREFIX,
    name: TENANT_VAULTS_ROUTE_NAME,
    redirect: () => vaultsPaths.tenantVaults(),
    meta: {
      requiresAuth: true,
      module: 'vaults',
      icon: 'Wallet',
      breadcrumb: 'Mis Gaveteros',
      title: 'Mis Gaveteros',
    },
    children: [
      {
        path: '',
        name: vaultsRouteNames.tenantVaults,
        component: TenantVaultView,
        meta: {
          title: 'Mis Gaveteros',
          breadcrumb: 'Mis Gaveteros',
          description: 'Gestiona los gaveteros de tu negocio',
        },
      },
    ],
  },
];
