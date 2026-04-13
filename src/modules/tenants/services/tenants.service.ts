/**
 * @fileoverview Servicio de API para Tenants (Comercios)
 * @module @modules/tenants/services/tenants.service
 * 
 * Gestión de comercios, tipos de comercio y validación SENIAT.
 * Integración con Providencias SENIAT para datos fiscales.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse, PaginatedResponse } from '@core/types';
import type {
  Tenant,
  TenantType,
  TenantCreateData,
  TenantUpdateData,
  TenantActivationData,
  TenantFilters,
  TenantStats,
  SeniatTaxpayerInfo,
  SeniatValidationResult,
} from '../types';

const BASE_URL = '/tenants';
const SENIAT_URL = '/seniat';

// =============================================================================
// TENANTS (COMERCIOS)
// =============================================================================

/**
 * Obtener listado de comercios
 */
export async function fetchTenants(
  filters?: TenantFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Tenant>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<Tenant>>>(
    `${BASE_URL}/`,
    { params: { ...filters, page, page_size: pageSize } }
  );
  return response.data.data!;
}

/**
 * Obtener un comercio por ID
 */
export async function fetchTenantById(id: string): Promise<Tenant | null> {
  const response = await httpClient.get<ApiResponse<Tenant>>(
    `${BASE_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Obtener comercio por slug
 */
export async function fetchTenantBySlug(slug: string): Promise<Tenant | null> {
  const response = await httpClient.get<ApiResponse<Tenant>>(
    `${BASE_URL}/by-slug/${slug}/`
  );
  return response.data.data || null;
}

/**
 * Crear nuevo comercio
 */
export async function createTenant(data: TenantCreateData): Promise<Tenant | null> {
  const response = await httpClient.post<ApiResponse<Tenant>>(
    `${BASE_URL}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Actualizar comercio
 */
export async function updateTenant(
  id: string,
  data: TenantUpdateData
): Promise<Tenant | null> {
  const response = await httpClient.patch<ApiResponse<Tenant>>(
    `${BASE_URL}/${id}/`,
    data
  );
  return response.data.data || null;
}

/**
 * Activar comercio (completa registro)
 */
export async function activateTenant(
  data: TenantActivationData
): Promise<{ tenant: Tenant; accessToken: string; refreshToken: string } | null> {
  const response = await httpClient.post<ApiResponse<{
    tenant: Tenant;
    access_token: string;
    refresh_token: string;
  }>>(
    `${BASE_URL}/activate/`,
    data
  );
  
  if (response.data.data) {
    return {
      tenant: response.data.data.tenant,
      accessToken: response.data.data.access_token,
      refreshToken: response.data.data.refresh_token,
    };
  }
  return null;
}

/**
 * Suspender comercio
 */
export async function suspendTenant(id: string, reason?: string): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/${id}/suspend/`, { reason });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reactivar comercio
 */
export async function reactivateTenant(id: string): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/${id}/reactivate/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Eliminar comercio (soft delete)
 */
export async function deleteTenant(id: string): Promise<boolean> {
  try {
    await httpClient.delete(`${BASE_URL}/${id}/`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// TENANT TYPES (TIPOS DE COMERCIO)
// =============================================================================

/**
 * Obtener tipos de comercio disponibles
 */
export async function fetchTenantTypes(): Promise<TenantType[]> {
  const response = await httpClient.get<ApiResponse<TenantType[]>>(
    `${BASE_URL}/types/`
  );
  return response.data.data || [];
}

/**
 * Obtener tipo de comercio por ID
 */
export async function fetchTenantTypeById(id: string): Promise<TenantType | null> {
  const response = await httpClient.get<ApiResponse<TenantType>>(
    `${BASE_URL}/types/${id}/`
  );
  return response.data.data || null;
}

// =============================================================================
// SENIAT INTEGRATION (Providencias)
// =============================================================================

/**
 * Validar RIF en SENIAT
 * Usa la Providencia para consultar datos del contribuyente
 */
export async function validateTaxIdInSeniat(
  taxIdType: string,
  taxId: string
): Promise<SeniatValidationResult> {
  try {
    const response = await httpClient.post<ApiResponse<SeniatTaxpayerInfo>>(
      `${SENIAT_URL}/validate-rif/`,
      { tax_id_type: taxIdType, tax_id: taxId }
    );
    
    if (response.data.data) {
      return {
        isValid: true,
        taxpayer: response.data.data,
      };
    }
    
    return {
      isValid: false,
      error: response.data.message || 'No se encontró el contribuyente',
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.response?.data?.message || 'Error validando en SENIAT',
      errorCode: err.response?.data?.error_code,
    };
  }
}

/**
 * Obtener datos de contribuyente desde SENIAT
 * Método alternativo usando el endpoint público
 */
export async function fetchSeniatTaxpayerInfo(rif: string): Promise<SeniatTaxpayerInfo | null> {
  try {
    const response = await httpClient.get<ApiResponse<SeniatTaxpayerInfo>>(
      `${SENIAT_URL}/taxpayer/${rif}/`
    );
    return response.data.data || null;
  } catch {
    return null;
  }
}

// =============================================================================
// STATS & ANALYTICS
// =============================================================================

/**
 * Obtener estadísticas de comercios
 */
export async function fetchTenantStats(): Promise<TenantStats> {
  const response = await httpClient.get<ApiResponse<TenantStats>>(
    `${BASE_URL}/stats/`
  );
  return response.data.data || {
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    byType: [],
    byPlan: [],
    newThisMonth: 0,
    churnedThisMonth: 0,
  };
}

// =============================================================================
// REGISTRATION FLOW
// =============================================================================

/**
 * Verificar disponibilidad de slug
 */
export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; suggestions?: string[] }> {
  const response = await httpClient.get<ApiResponse<{ available: boolean; suggestions?: string[] }>>(
    `${BASE_URL}/check-slug/`,
    { params: { slug } }
  );
  return response.data.data || { available: false };
}

/**
 * Verificar disponibilidad de email
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const response = await httpClient.get<ApiResponse<{ available: boolean }>>(
      `${BASE_URL}/check-email/`,
      { params: { email } }
    );
    return response.data.data?.available || false;
  } catch {
    return false;
  }
}
