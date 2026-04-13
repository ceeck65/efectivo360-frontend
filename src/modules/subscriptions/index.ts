/**
 * @fileoverview Punto de entrada público del módulo Subscriptions (Planes y Licencias)
 * @module @modules/subscriptions
 * 
 * Gestión de planes de suscripción, licencias y pagos recibidos (SaaS level).
 * Integración con Efi AI para explicación y recomendación de planes.
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Plan types
  Plan,
  PlanCategory,
  BillingCycle,
  PlanPricing,
  PlanLimits,
  PlanFeature,
  PlanAiMetadata,
  
  // Subscription types
  Subscription,
  SubscriptionStatus,
  SubscriptionSummary,
  
  // Payment types
  SubscriptionPayment,
  PaymentMethod,
  PaymentStatus,
  Invoice,
  InvoiceItem,
  
  // Efi integration
  PlanExplanationContext,
  PlanRecommendation,
  
  // Form types
  SubscribeRequest,
  ChangePlanRequest,
  PaymentFilters,
  
  // Stats
  SaaSStats,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Plans
  fetchPlans,
  fetchPlanById,
  fetchPlanByCode,
  comparePlans,
  
  // Subscriptions
  fetchCurrentSubscription,
  fetchSubscriptionSummary,
  subscribeToPlan,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  updatePaymentMethod,
  
  // Payments
  fetchPaymentHistory,
  fetchPaymentById,
  fetchInvoice,
  getInvoicePdfUrl,
  retryPayment,
  
  // Efi AI
  explainPlansWithEfi,
  getPlanRecommendation,
  comparePlansForEfi,
  
  // Stats
  fetchSaaSStats,
  fetchAllPayments,
} from './services/subscriptions.service';

// =============================================================================
// STORE
// =============================================================================

export { useSubscriptionsStore } from './stores/subscriptionsStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  useSubscriptions,
  usePlanUpgrade,
  useSubscriptionWizard,
} from './composables/useSubscriptions';
