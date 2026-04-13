/**
 * @fileoverview Tipos del módulo Subscriptions (Planes y Licencias)
 * @module @modules/subscriptions/types
 * 
 * Gestión de planes de suscripción, licencias y pagos recibidos (SaaS level).
 * Integración con Efi para explicación de planes.
 */

import type { ULID } from '@core/types';

// =============================================================================
// PLAN TYPES
// =============================================================================

/**
 * Nivel/periodo del plan
 */
export type BillingCycle = 'monthly' | 'quarterly' | 'biannual' | 'yearly';

/**
 * Categoría del plan
 */
export type PlanCategory = 
  | 'starter'     // Inicial/Prueba
  | 'basic'       // Básico
  | 'professional'// Profesional
  | 'enterprise'  // Empresarial
  | 'custom';     // Personalizado

/**
 * Plan de suscripción
 */
export interface Plan {
  id: ULID;
  code: string;
  name: string;
  description: string;
  
  // Categoría
  category: PlanCategory;
  isPublic: boolean;      // Visible para clientes
  isActive: boolean;        // Disponible para contratar
  sortOrder: number;
  
  // Precios por ciclo de facturación
  pricing: PlanPricing;
  
  // Límites y features
  limits: PlanLimits;
  features: PlanFeature[];
  
  // Metadatos para Efi (AI)
  aiMetadata?: PlanAiMetadata;
  
  // Trial
  hasTrial: boolean;
  trialDays: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Precios del plan por ciclo
 */
export interface PlanPricing {
  monthly?: number;
  quarterly?: number;
  biannual?: number;
  yearly?: number;
  currency: string;
}

/**
 * Límites del plan
 */
export interface PlanLimits {
  maxProducts: number | null;      // null = ilimitado
  maxUsers: number | null;
  maxTenants: number | null;
  maxLocations: number | null;
  maxStorageMb: number | null;
  maxTransactionsPerMonth: number | null;
  maxApiCallsPerMonth: number | null;
}

/**
 * Feature del plan
 */
export interface PlanFeature {
  code: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  icon?: string;
  includedIn: BillingCycle[];  // En qué ciclos está incluido
}

/**
 * Metadatos para explicación por Efi AI
 */
export interface PlanAiMetadata {
  // Descripción conversacional del plan
  elevatorPitch: string;
  
  // Ideal para qué tipo de negocio
  idealFor: string[];
  
  // Casos de uso recomendados
  useCases: string[];
  
  // Comparativa rápida con otros planes
  comparisonNotes: string;
  
  // Preguntas frecuentes específicas del plan
  faqs: Array<{ question: string; answer: string }>;
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

/**
 * Estado de la suscripción
 */
export type SubscriptionStatus = 
  | 'trial'       // Período de prueba
  | 'active'      // Activa y pagada
  | 'past_due'    // Pago vencido
  | 'cancelled'   // Cancelada
  | 'expired'     // Expirada
  | 'suspended';  // Suspendida

/**
 * Suscripción de un tenant
 */
export interface Subscription {
  id: ULID;
  tenantId: ULID;
  planId: ULID;
  
  // Estado
  status: SubscriptionStatus;
  isAutoRenew: boolean;
  
  // Fechas
  startsAt: string;
  endsAt: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  
  // Facturación
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  
  // Pago actual
  currentPaymentId?: ULID;
  
  // Historial
  paymentHistory: SubscriptionPayment[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Resumen de suscripción para el tenant
 */
export interface SubscriptionSummary {
  subscription: Subscription;
  plan: Plan;
  daysRemaining: number;
  isInGracePeriod: boolean;
  gracePeriodDays: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
}

// =============================================================================
// PAYMENT TYPES (SaaS Level)
// =============================================================================

/**
 * Método de pago
 */
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'crypto' | 'other';

/**
 * Estado del pago
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

/**
 * Pago recibido (SaaS level - del tenant a la plataforma)
 */
export interface SubscriptionPayment {
  id: ULID;
  subscriptionId: ULID;
  tenantId: ULID;
  planId: ULID;
  
  // Monto
  amount: number;
  currency: string;
  exchangeRate?: number;  // Si paga en otra moneda
  
  // Método
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: PaymentMethodDetails;
  
  // Referencias externas
  externalReference?: string;     // Referencia del gateway
  receiptUrl?: string;
  
  // Estado
  status: PaymentStatus;
  
  // Fechas
  paidAt?: string;
  processedAt?: string;
  
  // Periodo cubierto
  periodStart: string;
  periodEnd: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Detalles del método de pago
 */
export interface PaymentMethodDetails {
  // Tarjeta
  cardLast4?: string;
  cardBrand?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  
  // Transferencia
  bankName?: string;
  accountNumber?: string;
  referenceNumber?: string;
  
  // Crypto
  cryptoCurrency?: string;
  walletAddress?: string;
  transactionHash?: string;
}

/**
 * Factura generada
 */
export interface Invoice {
  id: ULID;
  paymentId: ULID;
  tenantId: ULID;
  subscriptionId: ULID;
  
  // Datos fiscales
  invoiceNumber: string;
  taxId: string;
  legalName: string;
  
  // Totales
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  
  // Items
  items: InvoiceItem[];
  
  // URLs
  pdfUrl?: string;
  xmlUrl?: string;  // XML fiscal (Venezuela/CFDI)
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// =============================================================================
// EFI INTEGRATION TYPES
// =============================================================================

/**
 * Contexto para que Efi explique planes
 */
export interface PlanExplanationContext {
  currentPlanId?: ULID;
  tenantType?: string;
  userQuestions?: string[];
  preferredFormat?: 'detailed' | 'summary' | 'comparison';
}

/**
 * Recomendación de plan por Efi
 */
export interface PlanRecommendation {
  recommendedPlanId: ULID;
  confidence: number;  // 0-1
  reasoning: string;
  alternativePlans: ULID[];
  estimatedSavings?: {
    monthly: number;
    yearly: number;
  };
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Datos para suscribirse a un plan
 */
export interface SubscribeRequest {
  planId: ULID;
  billingCycle: BillingCycle;
  paymentMethodId?: ULID;
  isAutoRenew: boolean;
  startImmediately: boolean;
}

/**
 * Datos para cambiar de plan
 */
export interface ChangePlanRequest {
  newPlanId: ULID;
  billingCycle: BillingCycle;
  prorationOption: 'immediate' | 'next_cycle';
}

/**
 * Filtros para pagos
 */
export interface PaymentFilters {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  tenantId?: ULID;
  dateFrom?: string;
  dateTo?: string;
}

// =============================================================================
// STATS TYPES
// =============================================================================

/**
 * Estadísticas SaaS
 */
export interface SaaSStats {
  // MRR/ARR
  mrr: number;  // Monthly Recurring Revenue
  arr: number;  // Annual Recurring Revenue
  
  // Crecimiento
  mrrGrowth: number;  // % vs mes anterior
  newMrrThisMonth: number;
  churnedMrrThisMonth: number;
  
  // Clientes
  totalActiveSubscriptions: number;
  newSubscriptionsThisMonth: number;
  cancelledThisMonth: number;
  
  // Churn
  churnRate: number;  // %
  retentionRate: number;  // %
  
  // Por plan
  distributionByPlan: Array<{ planId: ULID; name: string; count: number; percentage: number }>;
  
  // Pagos
  totalPaymentsThisMonth: number;
  totalRevenueThisMonth: number;
  failedPaymentsThisMonth: number;
}
