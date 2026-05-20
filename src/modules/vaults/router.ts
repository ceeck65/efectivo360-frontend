/**
 * @fileoverview Router del módulo Vaults
 * @module @modules/vaults/router
 */

import type { RouteRecordRaw } from 'vue-router';

// Lazy loaded components
const GlobalVaultDashboard: any = () => import('./views/GlobalVaultDashboard.vue');
const SaasPaymentConnections: any = () => import('./views/SaasPaymentConnections.vue');
// @ts-expect-error - module may not exist yet
const StaffBlueprintView: any = () => import('./views/StaffBlueprintView.vue');
const StoreVaultDetail: any = () => import('./views/StoreVaultDetail.vue');
const StoreVaultPaymentConnections: any = () => import('./views/StoreVaultPaymentConnections.vue');
// @ts-expect-error - module may not exist yet
const TenantVaultView: any = () => import('./views/TenantVaultView.vue');

// Route constants
export const GLOBAL_VAULT_ROUTE_PREFIX = '/admin/staff/global-vault';
export const PAYMENT_BLUEPRINTS_ROUTE_PREFIX = '/admin/staff/payment-blueprints';
export const SAAS_CONNECTIONS_ROUTE_PREFIX = '/admin/staff/saas-connections';
export const STAFF_BLUEPRINT_ROUTE_PREFIX = '/admin/staff/blueprint-vaults';
export const STORE_VAULTS_ROUTE_PREFIX = '/admin/staff/store-vaults';
export const TENANT_VAULTS_ROUTE_PREFIX = '/my-vaults';

export const GLOBAL_VAULT_ROUTE_NAME = 'admin.staff.global-vault';
export const PAYMENT_BLUEPRINTS_ROUTE_NAME = 'admin.staff.payment-blueprints';
export const SAAS_CONNECTIONS_ROUTE_NAME = 'admin.staff.saas-connections';
export const STAFF_BLUEPRINT_ROUTE_NAME = 'admin.staff.blueprint-vaults';
export const STORE_VAULTS_ROUTE_NAME = 'admin.staff.store-vaults';
export const TENANT_VAULTS_ROUTE_NAME = 'tenant.vaults';

export const vaultsRouteNames = {
  globalVault: `${GLOBAL_VAULT_ROUTE_NAME}.dashboard`,
  paymentBlueprints: `${PAYMENT_BLUEPRINTS_ROUTE_NAME}.dashboard`,
  saasConnections: `${SAAS_CONNECTIONS_ROUTE_NAME}.dashboard`,
  staffBlueprint: `${STAFF_BLUEPRINT_ROUTE_NAME}.list`,
  storeVaultDetail: `${STORE_VAULTS_ROUTE_NAME}.detail`,
  storeVaultPayments: `${STORE_VAULTS_ROUTE_NAME}.payments`,
  tenantVaults: `${TENANT_VAULTS_ROUTE_NAME}.list`,
} as const;

export const vaultsPaths = {
  globalVault: () => GLOBAL_VAULT_ROUTE_PREFIX,
  paymentBlueprints: () => PAYMENT_BLUEPRINTS_ROUTE_PREFIX,
  saasConnections: () => SAAS_CONNECTIONS_ROUTE_PREFIX,
  staffBlueprint: () => STAFF_BLUEPRINT_ROUTE_PREFIX,
  storeVaults: () => STORE_VAULTS_ROUTE_PREFIX,
  tenantVaults: () => TENANT_VAULTS_ROUTE_PREFIX,
} as const;

export const vaultsRoutes: RouteRecordRaw[] = [
  // Global Vault (SaaS)
  {
    path: GLOBAL_VAULT_ROUTE_PREFIX,
    name: GLOBAL_VAULT_ROUTE_NAME,
    redirect: () => vaultsPaths.globalVault(),
    meta: { requiresAuth: true, requiresStaff: true, module: 'vaults', icon: 'Globe', breadcrumb: 'Global Vault', title: 'Global Vault' },
    children: [{
      path: '',
      name: vaultsRouteNames.globalVault,
      component: GlobalVaultDashboard,
      meta: { title: 'Global Vault', breadcrumb: 'Global Vault', requiresStaff: true, description: 'Catálogo maestro de métodos de pago y tipos de bóvedas' },
    }],
  },
  // Payment Blueprints
  {
    path: PAYMENT_BLUEPRINTS_ROUTE_PREFIX,
    name: PAYMENT_BLUEPRINTS_ROUTE_NAME,
    redirect: () => vaultsPaths.paymentBlueprints(),
    meta: { requiresAuth: true, requiresStaff: true, module: 'vaults', icon: 'CreditCard', breadcrumb: 'Blueprints de Pago', title: 'Blueprints de Pago' },
    children: [{
      path: '',
      name: vaultsRouteNames.paymentBlueprints,
        component: () => import('@/views/admin/blueprints/BlueprintsView.vue'),
      meta: { title: 'Blueprints de Pago', breadcrumb: 'Blueprints de Pago', requiresStaff: true, description: 'Gestiona los moldes de pago: Digitales, Manuales y Cripto' },
    }],
  },
  // SaaS Payment Connections
  {
    path: SAAS_CONNECTIONS_ROUTE_PREFIX,
    name: SAAS_CONNECTIONS_ROUTE_NAME,
    redirect: () => vaultsPaths.saasConnections(),
    meta: { requiresAuth: true, requiresStaff: true, module: 'vaults', icon: 'Link', breadcrumb: 'Conexiones SaaS', title: 'Conexiones SaaS' },
    children: [{
      path: '',
      name: vaultsRouteNames.saasConnections,
      component: SaasPaymentConnections,
      meta: { title: 'Conexiones de Pago SaaS', breadcrumb: 'Conexiones SaaS', requiresStaff: true, description: 'Conecta las cuentas bancarias del SaaS para cobrar suscripciones' },
    }],
  },
  // Staff Blueprint (Gaveteros)
  {
    path: STAFF_BLUEPRINT_ROUTE_PREFIX,
    name: STAFF_BLUEPRINT_ROUTE_NAME,
    redirect: () => vaultsPaths.staffBlueprint(),
    meta: { requiresAuth: true, requiresStaff: true, module: 'vaults', icon: 'Archive', breadcrumb: 'Blueprint de Gaveteros', title: 'Blueprint de Gaveteros' },
    children: [{
      path: '',
      name: vaultsRouteNames.staffBlueprint,
      component: StaffBlueprintView,
      meta: { title: 'Blueprint de Gaveteros', breadcrumb: 'Blueprint de Gaveteros', requiresStaff: true, description: 'Gestiona las plantillas de gaveteros para todos los tenants' },
    }],
  },
  // Store Vaults
  {
    path: STORE_VAULTS_ROUTE_PREFIX,
    name: STORE_VAULTS_ROUTE_NAME,
    redirect: () => vaultsPaths.storeVaults(),
    meta: { requiresAuth: true, requiresStaff: true, module: 'vaults', icon: 'Store', breadcrumb: 'Store Vaults', title: 'Store Vaults' },
    children: [
      {
        path: ':ulid',
        name: vaultsRouteNames.storeVaultDetail,
        component: StoreVaultDetail,
        meta: { title: 'Detalle de Store Vault', breadcrumb: 'Detalle Store Vault', requiresStaff: true },
      },
      {
        path: ':ulid/payments',
        name: vaultsRouteNames.storeVaultPayments,
        component: StoreVaultPaymentConnections,
        meta: { title: 'Conexiones de Pago', breadcrumb: 'Pagos', requiresStaff: true },
      },
    ],
  },
  // Tenant Vaults
  {
    path: TENANT_VAULTS_ROUTE_PREFIX,
    name: TENANT_VAULTS_ROUTE_NAME,
    redirect: () => vaultsPaths.tenantVaults(),
    meta: { requiresAuth: true, module: 'vaults', icon: 'Wallet', breadcrumb: 'Mis Gaveteros', title: 'Mis Gaveteros' },
    children: [{
      path: '',
      name: vaultsRouteNames.tenantVaults,
      component: TenantVaultView,
      meta: { title: 'Mis Gaveteros', breadcrumb: 'Mis Gaveteros', description: 'Gestiona los gaveteros de tu negocio' },
    }],
  },
];
