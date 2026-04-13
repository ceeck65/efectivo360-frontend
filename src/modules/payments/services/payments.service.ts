/**
 * @fileoverview Servicio de API para Payments
 * Unifica endpoints de métodos de pago SaaS, Tenant y plantillas
 * @module @modules/payments/services/payments.service
 */

import { httpClient } from '@core/index.js';
import type { ULID, PaginatedResponse } from '@core/types';
import type {
  Currency,
  ExchangeRate,
  PaymentMethodTemplate,
  SaasPaymentMethod,
  TenantSaasPaymentMethodView,
  TenantPaymentMethod,
  PublicPaymentMethodView,
  PaymentTransaction,
  PaymentCategory,
  PaymentTypeOption,
  CurrencyFormData,
  ExchangeRateFormData,
  SaasPaymentMethodFormData,
  TenantPaymentMethodFormData,
  PaymentMethodFilters,
  TransactionFilters,
} from '../types';

// =============================================================================
// CURRENCY API
// =============================================================================

/**
 * Obtiene todas las monedas del sistema
 * @returns Lista de monedas
 */
export async function fetchCurrencies(): Promise<Currency[]> {
  const response = await httpClient.get<PaginatedResponse<Currency>>('/api/currencies/');
  return response.data.results;
}

/**
 * Obtiene una moneda por su ID
 * @param id - ULID de la moneda
 * @returns Moneda
 */
export async function fetchCurrencyById(id: ULID): Promise<Currency> {
  const response = await httpClient.get<{ data: Currency }>(`/api/currencies/${id}/`);
  return response.data.data;
}

/**
 * Crea una nueva moneda (solo Staff)
 * @param data - Datos de la moneda
 * @returns Moneda creada
 */
export async function createCurrency(data: CurrencyFormData): Promise<Currency> {
  const response = await httpClient.post<{ data: Currency }>('/api/currencies/', data);
  return response.data.data;
}

/**
 * Actualiza una moneda existente (solo Staff)
 * @param id - ULID de la moneda
 * @param data - Datos actualizados
 * @returns Moneda actualizada
 */
export async function updateCurrency(id: ULID, data: CurrencyFormData): Promise<Currency> {
  const response = await httpClient.put<{ data: Currency }>(`/api/currencies/${id}/`, data);
  return response.data.data;
}

/**
 * Elimina una moneda (solo Staff)
 * @param id - ULID de la moneda
 */
export async function deleteCurrency(id: ULID): Promise<void> {
  await httpClient.delete(`/api/currencies/${id}/`);
}

/**
 * Activa/desactiva una moneda (solo Staff)
 * @param id - ULID de la moneda
 * @param isActive - Estado deseado
 */
export async function toggleCurrencyStatus(id: ULID, isActive: boolean): Promise<void> {
  await httpClient.post(`/api/currencies/${id}/toggle/`, { is_active: isActive });
}

// =============================================================================
// EXCHANGE RATE API
// =============================================================================

/**
 * Obtiene las tasas de cambio activas
 * @returns Lista de tasas
 */
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const response = await httpClient.get<PaginatedResponse<ExchangeRate>>('/api/exchange-rates/');
  return response.data.results;
}

/**
 * Obtiene la tasa entre dos monedas
 * @param fromCurrencyId - Moneda origen
 * @param toCurrencyId - Moneda destino
 * @returns Tasa de cambio
 */
export async function fetchExchangeRate(
  fromCurrencyId: ULID,
  toCurrencyId: ULID
): Promise<ExchangeRate> {
  const response = await httpClient.get<{ data: ExchangeRate }>(
    `/api/exchange-rates/convert/?from=${fromCurrencyId}&to=${toCurrencyId}`
  );
  return response.data.data;
}

/**
 * Crea una nueva tasa de cambio (solo Staff)
 * @param data - Datos de la tasa
 * @returns Tasa creada
 */
export async function createExchangeRate(data: ExchangeRateFormData): Promise<ExchangeRate> {
  const response = await httpClient.post<{ data: ExchangeRate }>('/api/exchange-rates/', data);
  return response.data.data;
}

/**
 * Actualiza una tasa de cambio (solo Staff)
 * @param id - ULID de la tasa
 * @param data - Datos actualizados
 * @returns Tasa actualizada
 */
export async function updateExchangeRate(id: ULID, data: ExchangeRateFormData): Promise<ExchangeRate> {
  const response = await httpClient.put<{ data: ExchangeRate }>(`/api/exchange-rates/${id}/`, data);
  return response.data.data;
}

/**
 * Elimina una tasa de cambio (solo Staff)
 * @param id - ULID de la tasa
 */
export async function deleteExchangeRate(id: ULID): Promise<void> {
  await httpClient.delete(`/api/exchange-rates/${id}/`);
}

// =============================================================================
// PAYMENT TEMPLATES API (STAFF ONLY)
// =============================================================================

/**
 * Obtiene todas las plantillas de métodos de pago
 * @param filters - Filtros opcionales
 * @returns Lista de plantillas
 */
export async function fetchPaymentTemplates(
  filters?: PaymentMethodFilters
): Promise<PaymentMethodTemplate[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  
  const url = `/api/staff/payment-templates/${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await httpClient.get<PaginatedResponse<PaymentMethodTemplate>>(url);
  return response.data.results;
}

/**
 * Obtiene una plantilla por ID
 * @param id - ULID de la plantilla
 * @returns Plantilla
 */
export async function fetchPaymentTemplateById(id: ULID): Promise<PaymentMethodTemplate> {
  const response = await httpClient.get<{ data: PaymentMethodTemplate }>(`/api/staff/payment-templates/${id}/`);
  return response.data.data;
}

/**
 * Crea una nueva plantilla de método de pago (solo Staff)
 * @param data - Datos de la plantilla (FormData para soportar logo)
 * @returns Plantilla creada
 */
export async function createPaymentTemplate(data: FormData): Promise<PaymentMethodTemplate> {
  const response = await httpClient.post<{ data: PaymentMethodTemplate }>(
    '/api/staff/payment-templates/',
    data,
    { headers: {} } // Content-Type se maneja automáticamente para FormData
  );
  return response.data.data;
}

/**
 * Actualiza una plantilla (solo Staff)
 * @param id - ULID de la plantilla
 * @param data - Datos actualizados (FormData)
 * @returns Plantilla actualizada
 */
export async function updatePaymentTemplate(id: ULID, data: FormData): Promise<PaymentMethodTemplate> {
  const response = await httpClient.put<{ data: PaymentMethodTemplate }>(
    `/api/staff/payment-templates/${id}/`,
    data,
    { headers: {} }
  );
  return response.data.data;
}

/**
 * Elimina una plantilla (solo Staff)
 * @param id - ULID de la plantilla
 */
export async function deletePaymentTemplate(id: ULID): Promise<void> {
  await httpClient.delete(`/api/staff/payment-templates/${id}/`);
}

/**
 * Activa/desactiva una plantilla (solo Staff)
 * @param id - ULID de la plantilla
 * @param isActive - Estado deseado
 */
export async function toggleTemplateStatus(id: ULID, isActive: boolean): Promise<void> {
  await httpClient.post(`/api/staff/payment-templates/${id}/toggle/`, { is_active: isActive });
}

// =============================================================================
// SAAS PAYMENT METHODS API (STAFF & TENANT VIEWS)
// =============================================================================

/**
 * Obtiene los métodos de pago SaaS (vista Staff completa)
 * @returns Lista de métodos SaaS
 */
export async function fetchSaasPaymentMethods(): Promise<SaasPaymentMethod[]> {
  const response = await httpClient.get<PaginatedResponse<SaasPaymentMethod>>('/api/staff/saas-payment-methods/');
  return response.data.results;
}

/**
 * Obtiene los métodos SaaS disponibles para el Tenant (vista filtrada)
 * @returns Lista de métodos visibles para Tenant
 */
export async function fetchTenantSaasPaymentMethods(): Promise<TenantSaasPaymentMethodView[]> {
  const response = await httpClient.get<PaginatedResponse<TenantSaasPaymentMethodView>>('/api/tenant/saas-payment-methods/');
  return response.data.results;
}

/**
 * Crea un método de pago SaaS (solo Staff)
 * @param data - Datos del método
 * @returns Método creado
 */
export async function createSaasPaymentMethod(data: SaasPaymentMethodFormData): Promise<SaasPaymentMethod> {
  const response = await httpClient.post<{ data: SaasPaymentMethod }>('/api/staff/saas-payment-methods/', data);
  return response.data.data;
}

/**
 * Actualiza un método SaaS (solo Staff)
 * @param id - ULID del método
 * @param data - Datos actualizados
 * @returns Método actualizado
 */
export async function updateSaasPaymentMethod(
  id: ULID,
  data: Partial<SaasPaymentMethodFormData>
): Promise<SaasPaymentMethod> {
  const response = await httpClient.put<{ data: SaasPaymentMethod }>(`/api/staff/saas-payment-methods/${id}/`, data);
  return response.data.data;
}

/**
 * Elimina un método SaaS (solo Staff)
 * @param id - ULID del método
 */
export async function deleteSaasPaymentMethod(id: ULID): Promise<void> {
  await httpClient.delete(`/api/staff/saas-payment-methods/${id}/`);
}

// =============================================================================
// TENANT PAYMENT METHODS API
// =============================================================================

/**
 * Obtiene los métodos de pago del tenant actual
 * @returns Lista de métodos del tenant
 */
export async function fetchTenantPaymentMethods(): Promise<TenantPaymentMethod[]> {
  const response = await httpClient.get<PaginatedResponse<TenantPaymentMethod>>('/api/tenant/payment-methods/');
  return response.data.results;
}

/**
 * Obtiene los métodos de pago públicos de un tenant (para checkout)
 * @param tenantSlug - Slug del tenant
 * @returns Lista de métodos públicos
 */
export async function fetchPublicPaymentMethods(tenantSlug: string): Promise<PublicPaymentMethodView[]> {
  const response = await httpClient.get<PaginatedResponse<PublicPaymentMethodView>>(
    `/api/public/${tenantSlug}/payment-methods/`
  );
  return response.data.results;
}

/**
 * Crea un método de pago para el tenant
 * @param data - Datos del método
 * @returns Método creado
 */
export async function createTenantPaymentMethod(data: TenantPaymentMethodFormData): Promise<TenantPaymentMethod> {
  const response = await httpClient.post<{ data: TenantPaymentMethod }>('/api/tenant/payment-methods/', data);
  return response.data.data;
}

/**
 * Actualiza un método de pago del tenant
 * @param id - ULID del método
 * @param data - Datos actualizados
 * @returns Método actualizado
 */
export async function updateTenantPaymentMethod(
  id: ULID,
  data: Partial<TenantPaymentMethodFormData>
): Promise<TenantPaymentMethod> {
  const response = await httpClient.put<{ data: TenantPaymentMethod }>(`/api/tenant/payment-methods/${id}/`, data);
  return response.data.data;
}

/**
 * Elimina un método de pago del tenant
 * @param id - ULID del método
 */
export async function deleteTenantPaymentMethod(id: ULID): Promise<void> {
  await httpClient.delete(`/api/tenant/payment-methods/${id}/`);
}

/**
 * Activa/desactiva un método de pago del tenant
 * @param id - ULID del método
 * @param isActive - Estado deseado
 */
export async function toggleTenantPaymentMethodStatus(id: ULID, isActive: boolean): Promise<void> {
  await httpClient.post(`/api/tenant/payment-methods/${id}/toggle/`, { is_active: isActive });
}

// =============================================================================
// PAYMENT CATEGORIES & TYPES API
// =============================================================================

/**
 * Obtiene las categorías de métodos de pago
 * @returns Lista de categorías
 */
export async function fetchPaymentCategories(): Promise<PaymentCategory[]> {
  const response = await httpClient.get<PaginatedResponse<PaymentCategory>>('/api/payment-categories/');
  return response.data.results;
}

/**
 * Obtiene los tipos de pago disponibles
 * @returns Lista de tipos
 */
export async function fetchPaymentTypes(): Promise<PaymentTypeOption[]> {
  const response = await httpClient.get<PaginatedResponse<PaymentTypeOption>>('/api/payment-types/');
  return response.data.results;
}

// =============================================================================
// PAYMENT TRANSACTIONS API
// =============================================================================

/**
 * Obtiene las transacciones del tenant
 * @param filters - Filtros opcionales
 * @returns Lista de transacciones
 */
export async function fetchTransactions(filters?: TransactionFilters): Promise<PaymentTransaction[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.payment_method_id) params.append('payment_method_id', filters.payment_method_id);
  
  const url = `/api/tenant/transactions/${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await httpClient.get<PaginatedResponse<PaymentTransaction>>(url);
  return response.data.results;
}

/**
 * Obtiene una transacción por ID
 * @param id - ULID de la transacción
 * @returns Transacción
 */
export async function fetchTransactionById(id: ULID): Promise<PaymentTransaction> {
  const response = await httpClient.get<{ data: PaymentTransaction }>(`/api/tenant/transactions/${id}/`);
  return response.data.data;
}

/**
 * Crea una nueva transacción
 * @param data - Datos de la transacción
 * @returns Transacción creada
 */
export async function createTransaction(
  data: Partial<PaymentTransaction>
): Promise<PaymentTransaction> {
  const response = await httpClient.post<{ data: PaymentTransaction }>('/api/tenant/transactions/', data);
  return response.data.data;
}

/**
 * Actualiza el estado de una transacción
 * @param id - ULID de la transacción
 * @param status - Nuevo estado
 * @returns Transacción actualizada
 */
export async function updateTransactionStatus(
  id: ULID,
  status: PaymentTransaction['status']
): Promise<PaymentTransaction> {
  const response = await httpClient.patch<{ data: PaymentTransaction }>(
    `/api/tenant/transactions/${id}/`,
    { status }
  );
  return response.data.data;
}

// =============================================================================
// CONVERSION API
// =============================================================================

/**
 * Convierte un monto entre monedas
 * @param amount - Monto a convertir
 * @param fromCurrencyId - Moneda origen
 * @param toCurrencyId - Moneda destino
 * @returns Resultado de la conversión
 */
export async function convertCurrency(
  amount: number,
  fromCurrencyId: ULID,
  toCurrencyId: ULID
): Promise<{
  original_amount: number;
  converted_amount: number;
  rate: number;
  from_currency: Currency;
  to_currency: Currency;
}> {
  const response = await httpClient.post<{
    data: {
      original_amount: number;
      converted_amount: number;
      rate: number;
      from_currency: Currency;
      to_currency: Currency;
    }
  }>('/api/currency/convert/', {
    amount,
    from_currency_id: fromCurrencyId,
    to_currency_id: toCurrencyId,
  });
  return response.data.data;
}
