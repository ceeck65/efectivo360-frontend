/**
 * @fileoverview Punto de entrada público del módulo Payments
 * @module @modules/payments
 * 
 * Este módulo unifica la gestión de:
 * - Monedas y tasas de cambio
 * - Métodos de pago (Templates, SaaS, Tenant)
 * - Transacciones y reportes
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Currency types
  Currency,
  ExchangeRate,
  CurrencyFormatRules,
  CurrencyFormData,
  ExchangeRateFormData,
  CurrencyConversionResult,
  
  // Payment method types
  PaymentMethodTemplate,
  SaasPaymentMethod,
  TenantSaasPaymentMethodView,
  TenantPaymentMethod,
  PublicPaymentMethodView,
  PaymentCategory,
  PaymentTypeOption,
  MetadataField,
  
  // Transaction types
  PaymentTransaction,
  TransactionFilters,
  PaymentMethodAvailability,
  
  // Form types
  PaymentMethodTemplateFormData,
  SaasPaymentMethodFormData,
  TenantPaymentMethodFormData,
  
  // Config types
  TenantPaymentConfig,
  GlobalPaymentConfig,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Currency API
  fetchCurrencies,
  fetchCurrencyById,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  toggleCurrencyStatus,
  
  // Exchange Rate API
  fetchExchangeRates,
  fetchExchangeRate,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  
  // Templates API
  fetchPaymentTemplates,
  fetchPaymentTemplateById,
  createPaymentTemplate,
  updatePaymentTemplate,
  deletePaymentTemplate,
  toggleTemplateStatus,
  
  // SaaS Methods API
  fetchSaasPaymentMethods,
  fetchTenantSaasPaymentMethods,
  createSaasPaymentMethod,
  updateSaasPaymentMethod,
  deleteSaasPaymentMethod,
  
  // Tenant Methods API
  fetchTenantPaymentMethods,
  fetchPublicPaymentMethods,
  createTenantPaymentMethod,
  updateTenantPaymentMethod,
  deleteTenantPaymentMethod,
  toggleTenantPaymentMethodStatus,
  
  // Categories & Types
  fetchPaymentCategories,
  fetchPaymentTypes,
  
  // Transactions API
  fetchTransactions,
  fetchTransactionById,
  createTransaction,
  updateTransactionStatus,
  
  // Conversion API
  convertCurrency,
} from './services/payments.service';

// =============================================================================
// STORE
// =============================================================================

export { usePaymentsStore } from './stores/paymentsStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  usePayments,
  usePublicPayments,
  useStaffPayments,
  useTenantPayments,
} from './composables/usePayments';

// =============================================================================
// ROUTER
// =============================================================================

export {
  paymentsRoutes,
  paymentsRouteNames,
  paymentsPaths,
  PAYMENTS_ROUTE_PREFIX,
  PAYMENTS_ROUTE_NAME,
} from './router';
