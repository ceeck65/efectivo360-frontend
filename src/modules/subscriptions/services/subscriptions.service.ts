/**
 * @fileoverview Servicio de API para Subscriptions (Planes y Licencias)
 * @module @modules/subscriptions/services/subscriptions.service
 * 
 * Gestión de planes, suscripciones y pagos recibidos (SaaS level).
 * Incluye integración con Efi AI para explicación de planes.
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse, PaginatedResponse } from '@core/types';
import type {
  Plan,
  Subscription,
  SubscriptionPayment,
  SubscriptionSummary,
  Invoice,
  SubscribeRequest,
  ChangePlanRequest,
  PaymentFilters,
  SaaSStats,
  PlanRecommendation,
} from '../types';

const BASE_URL = '/subscriptions';
const PLANS_URL = '/plans';
const PAYMENTS_URL = '/payments';

// =============================================================================
// PLANS
// =============================================================================

/**
 * Obtener planes disponibles (públicos)
 */
export async function fetchPlans(): Promise<Plan[]> {
  const response = await httpClient.get<ApiResponse<Plan[]>>(
    `${PLANS_URL}/`
  );
  return response.data.data || [];
}

/**
 * Obtener plan por ID
 */
export async function fetchPlanById(id: string): Promise<Plan | null> {
  const response = await httpClient.get<ApiResponse<Plan>>(
    `${PLANS_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Obtener plan por código
 */
export async function fetchPlanByCode(code: string): Promise<Plan | null> {
  const response = await httpClient.get<ApiResponse<Plan>>(
    `${PLANS_URL}/by-code/${code}/`
  );
  return response.data.data || null;
}

/**
 * Comparar planes (para mostrar tabla comparativa)
 */
export async function comparePlans(planIds?: string[]): Promise<Plan[]> {
  const response = await httpClient.get<ApiResponse<Plan[]>>(
    `${PLANS_URL}/compare/`,
    { params: { ids: planIds?.join(',') } }
  );
  return response.data.data || [];
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

/**
 * Obtener suscripción actual del tenant
 */
export async function fetchCurrentSubscription(): Promise<Subscription | null> {
  const response = await httpClient.get<ApiResponse<Subscription>>(
    `${BASE_URL}/current/`
  );
  return response.data.data || null;
}

/**
 * Obtener resumen de suscripción
 */
export async function fetchSubscriptionSummary(): Promise<SubscriptionSummary | null> {
  const response = await httpClient.get<ApiResponse<SubscriptionSummary>>(
    `${BASE_URL}/summary/`
  );
  return response.data.data || null;
}

/**
 * Suscribirse a un plan
 */
export async function subscribeToPlan(data: SubscribeRequest): Promise<{ subscription: Subscription; paymentUrl?: string } | null> {
  const response = await httpClient.post<ApiResponse<{ subscription: Subscription; payment_url?: string }>>(
    `${BASE_URL}/subscribe/`,
    data
  );
  
  if (response.data.data) {
    return {
      subscription: response.data.data.subscription,
      paymentUrl: response.data.data.payment_url,
    };
  }
  return null;
}

/**
 * Cambiar de plan
 */
export async function changePlan(data: ChangePlanRequest): Promise<Subscription | null> {
  const response = await httpClient.post<ApiResponse<Subscription>>(
    `${BASE_URL}/change-plan/`,
    data
  );
  return response.data.data || null;
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(reason?: string): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/cancel/`, { reason });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reactivar suscripción cancelada
 */
export async function reactivateSubscription(): Promise<boolean> {
  try {
    await httpClient.post(`${BASE_URL}/reactivate/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Actualizar método de pago
 */
export async function updatePaymentMethod(paymentMethodId: string): Promise<boolean> {
  try {
    await httpClient.patch(`${BASE_URL}/payment-method/`, { payment_method_id: paymentMethodId });
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// PAYMENTS (SaaS Level)
// =============================================================================

/**
 * Obtener historial de pagos del tenant
 */
export async function fetchPaymentHistory(
  filters?: PaymentFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<SubscriptionPayment>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<SubscriptionPayment>>>(
    `${PAYMENTS_URL}/`,
    { params: { ...filters, page, page_size: pageSize } }
  );
  return response.data.data || { count: 0, results: [], next: null, previous: null };
}

/**
 * Obtener detalle de un pago
 */
export async function fetchPaymentById(id: string): Promise<SubscriptionPayment | null> {
  const response = await httpClient.get<ApiResponse<SubscriptionPayment>>(
    `${PAYMENTS_URL}/${id}/`
  );
  return response.data.data || null;
}

/**
 * Obtener factura de un pago
 */
export async function fetchInvoice(paymentId: string): Promise<Invoice | null> {
  const response = await httpClient.get<ApiResponse<Invoice>>(
    `${PAYMENTS_URL}/${paymentId}/invoice/`
  );
  return response.data.data || null;
}

/**
 * Descargar factura PDF
 */
export function getInvoicePdfUrl(invoiceId: string): string {
  return `${import.meta.env.VITE_API_URL || ''}${PAYMENTS_URL}/invoices/${invoiceId}/pdf/`;
}

// =============================================================================
// EFI AI INTEGRATION
// =============================================================================

/**
 * Obtener explicación de planes por Efi AI
 */
export async function explainPlansWithEfi(
  context?: { currentPlanId?: string; tenantType?: string; format?: 'detailed' | 'summary' | 'comparison' }
): Promise<{ explanation: string; recommendedPlanId?: string } | null> {
  const response = await httpClient.post<ApiResponse<{ explanation: string; recommended_plan_id?: string }>>(
    `${PLANS_URL}/explain/`,
    context || {}
  );
  
  if (response.data.data) {
    return {
      explanation: response.data.data.explanation,
      recommendedPlanId: response.data.data.recommended_plan_id,
    };
  }
  return null;
}

/**
 * Obtener recomendación de plan personalizada
 */
export async function getPlanRecommendation(
  answers: Record<string, string | number>
): Promise<PlanRecommendation | null> {
  const response = await httpClient.post<ApiResponse<PlanRecommendation>>(
    `${PLANS_URL}/recommend/`,
    { answers }
  );
  return response.data.data || null;
}

/**
 * Comparar planes para chat con Efi
 * Retorna formato simplificado para el chat
 */
export async function comparePlansForEfi(planIds: string[]): Promise<Array<{
  id: string;
  name: string;
  price: number;
  keyFeatures: string[];
  pros: string[];
  cons: string[];
}>> {
  const response = await httpClient.post<ApiResponse<Array<{
    id: string;
    name: string;
    price: number;
    keyFeatures: string[];
    pros: string[];
    cons: string[];
  }>>>(
    `${PLANS_URL}/compare-for-efi/`,
    { plan_ids: planIds }
  );
  return response.data.data || [];
}

// =============================================================================
// STATS (Staff Only)
// =============================================================================

/**
 * Obtener estadísticas SaaS
 */
export async function fetchSaaSStats(): Promise<SaaSStats> {
  const response = await httpClient.get<ApiResponse<SaaSStats>>(
    `${BASE_URL}/stats/`
  );
  return response.data.data || {
    mrr: 0,
    arr: 0,
    mrrGrowth: 0,
    newMrrThisMonth: 0,
    churnedMrrThisMonth: 0,
    totalActiveSubscriptions: 0,
    newSubscriptionsThisMonth: 0,
    cancelledThisMonth: 0,
    churnRate: 0,
    retentionRate: 0,
    distributionByPlan: [],
    totalPaymentsThisMonth: 0,
    totalRevenueThisMonth: 0,
    failedPaymentsThisMonth: 0,
  };
}

/**
 * Obtener pagos de todos los tenants (Staff)
 */
export async function fetchAllPayments(
  filters?: PaymentFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<SubscriptionPayment>> {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<SubscriptionPayment>>>(
    `${PAYMENTS_URL}/all/`,
    { params: { ...filters, page, page_size: pageSize } }
  );
  return response.data.data || { count: 0, results: [], next: null, previous: null };
}

// =============================================================================
// WEBHOOKS
// =============================================================================

/**
 * Reintentar pago fallido
 */
export async function retryPayment(paymentId: string): Promise<boolean> {
  try {
    await httpClient.post(`${PAYMENTS_URL}/${paymentId}/retry/`);
    return true;
  } catch {
    return false;
  }
}
