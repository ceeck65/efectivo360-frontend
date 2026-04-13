/**
 * @fileoverview Punto de entrada público del módulo Tenants (Comercios)
 * @module @modules/tenants
 * 
 * Gestión de comercios, tipos de comercio, registro y activación.
 * Integración con Providencias SENIAT para validación fiscal.
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Tenant types
  Tenant,
  TenantStatus,
  TaxIdType,
  TenantCreateData,
  TenantUpdateData,
  TenantActivationData,
  
  // Tenant type types
  TenantType,
  TenantFeature,
  TenantLimits,
  
  // Registration types
  TenantRegistration,
  SeniatTaxpayerInfo,
  SeniatValidationResult,
  
  // Filter types
  TenantFilters,
  TenantStats,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Tenants
  fetchTenants,
  fetchTenantById,
  fetchTenantBySlug,
  createTenant,
  updateTenant,
  activateTenant,
  suspendTenant,
  reactivateTenant,
  deleteTenant,
  
  // Tenant types
  fetchTenantTypes,
  fetchTenantTypeById,
  
  // SENIAT
  validateTaxIdInSeniat,
  fetchSeniatTaxpayerInfo,
  
  // Stats
  fetchTenantStats,
  
  // Registration helpers
  checkSlugAvailability,
  checkEmailAvailability,
} from './services/tenants.service';

// =============================================================================
// STORE
// =============================================================================

export { useTenantsStore } from './stores/tenantsStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  useTenants,
  useTenantRegistration,
} from './composables/useTenants';
