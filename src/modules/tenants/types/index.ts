/**
 * @fileoverview Tipos del módulo Tenants (Comercios/Tiendas)
 * @module @modules/tenants/types
 * 
 * Gestión de comercios, tipos de comercio, registro y activación.
 * Integración con Providencias SENIAT para datos fiscales.
 */

import type { ULID } from '@core/types';

// =============================================================================
// TENANT TYPES (Comercio/Tienda)
// =============================================================================

/**
 * Estado del comercio en el sistema
 */
export type TenantStatus = 
  | 'pending'      // Registrado, pendiente de activación
  | 'active'       // Activo y operativo
  | 'suspended'    // Suspendido por morosidad o incumplimiento
  | 'inactive'     // Inactivo por decisión del propietario
  | 'cancelled';   // Baja definitiva

/**
 * Tipo de identificación fiscal (Venezuela)
 */
export type TaxIdType = 'V' | 'E' | 'J' | 'G' | 'P' | 'C';

/**
 * Datos de un comercio/tenant
 */
export interface Tenant {
  id: ULID;
  slug: string;
  name: string;
  legalName: string;
  
  // Identificación fiscal (SENIAT)
  taxIdType: TaxIdType;
  taxId: string;  // RIF completo: J-12345678-9
  seniatValidated: boolean;
  seniatValidationDate?: string;
  
  // Contacto
  email: string;
  phone?: string;
  website?: string;
  
  // Dirección
  address?: string;
  stateId?: ULID;
  cityId?: ULID;
  
  // Configuración
  logoUrl?: string;
  timezone: string;
  currency: string;
  
  // Relaciones
  tenantTypeId: ULID;
  ownerId: ULID;
  
  // Estado
  status: TenantStatus;
  isActive: boolean;
  
  // Suscripción actual
  currentSubscriptionId?: ULID;
  planId?: ULID;
  planExpiresAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
}

/**
 * Datos para crear un comercio
 */
export interface TenantCreateData {
  name: string;
  legalName: string;
  taxIdType: TaxIdType;
  taxId: string;
  email: string;
  phone?: string;
  tenantTypeId: ULID;
  address?: string;
  stateId?: ULID;
  cityId?: ULID;
  timezone?: string;
  currency?: string;
}

/**
 * Datos para actualizar un comercio
 */
export interface TenantUpdateData {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  stateId?: ULID;
  cityId?: ULID;
  logoUrl?: string;
  timezone?: string;
  currency?: string;
}

// =============================================================================
// TENANT TYPE TYPES (Tipos de Comercio)
// =============================================================================

/**
 * Tipo/Categoría de comercio
 * Ej: Retail, Restaurante, Servicios, Mayorista, etc.
 */
export interface TenantType {
  id: ULID;
  code: string;
  name: string;
  description?: string;
  
  // Configuración por defecto para este tipo
  defaultFeatures: TenantFeature[];
  defaultLimits: TenantLimits;
  
  // UI
  icon?: string;
  color?: string;
  
  // Estado
  isActive: boolean;
  sortOrder: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Features disponibles para un tipo de comercio
 */
export interface TenantFeature {
  code: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  config?: Record<string, unknown>;
}

/**
 * Límites por defecto del tipo de comercio
 */
export interface TenantLimits {
  maxProducts?: number;
  maxUsers?: number;
  maxLocations?: number;
  maxStorageMb?: number;
  allowApiAccess?: boolean;
  allowCustomDomain?: boolean;
}

// =============================================================================
// REGISTRATION & ACTIVATION
// =============================================================================

/**
 * Datos del proceso de registro
 */
export interface TenantRegistration {
  // Paso 1: Datos básicos
  step: 1 | 2 | 3 | 4;
  
  // Paso 1: Identificación
  taxIdType?: TaxIdType;
  taxId?: string;
  seniatData?: SeniatTaxpayerInfo;
  
  // Paso 2: Datos del comercio
  name?: string;
  legalName?: string;
  tenantTypeId?: ULID;
  
  // Paso 3: Contacto
  email?: string;
  phone?: string;
  address?: string;
  
  // Paso 4: Confirmación
  planId?: ULID;
  agreedToTerms: boolean;
}

/**
 * Información de contribuyente desde SENIAT
 * Datos públicos obtenidos vía Providencia
 */
export interface SeniatTaxpayerInfo {
  taxId: string;           // RIF
  name: string;           // Razón social
  status: 'active' | 'inactive' | 'suspended';
  taxPayerType: string;   // Contribuyente formal, etc.
  
  // Domicilio fiscal (si está disponible públicamente)
  fiscalAddress?: string;
  
  // Última retención declarada (dato público)
  lastDeclarationPeriod?: string;
  
  // Cache
  fetchedAt: string;
}

/**
 * Datos para activar un comercio
 */
export interface TenantActivationData {
  tenantId: ULID;
  planId: ULID;
  paymentMethodId?: ULID;
  billingCycle: 'monthly' | 'yearly';
  
  // Datos del responsable
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

/**
 * Resultado de validación SENIAT
 */
export interface SeniatValidationResult {
  isValid: boolean;
  taxpayer?: SeniatTaxpayerInfo;
  error?: string;
  errorCode?: string;
}

// =============================================================================
// FILTER & LIST TYPES
// =============================================================================

/**
 * Filtros para listar comercios
 */
export interface TenantFilters {
  status?: TenantStatus;
  tenantTypeId?: ULID;
  planId?: ULID;
  isActive?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  seniatValidated?: boolean;
}

/**
 * Estadísticas de comercios
 */
export interface TenantStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  byType: Array<{ tenantTypeId: ULID; name: string; count: number }>;
  byPlan: Array<{ planId: ULID; name: string; count: number }>;
  newThisMonth: number;
  churnedThisMonth: number;
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Respuesta del endpoint SENIAT
 */
export interface SeniatApiResponse {
  success: boolean;
  data?: SeniatTaxpayerInfo;
  error?: string;
  errorCode?: string;
}
