/**
 * @fileoverview Tipos del módulo Payments - Usando ULIDs
 * @module @modules/payments/types
 */

import type { ULID } from '@core/types';

// =============================================================================
// CURRENCY TYPES
// =============================================================================

/** Reglas de formato para una moneda */
export interface CurrencyFormatRules {
  code: string;
  symbol: string;
  decimal_precision: number;
  symbol_position: 'prefix' | 'suffix';
  thousand_separator: string;
  decimal_separator: string;
}

/** Entidad Moneda */
export interface Currency {
  /** ULID de la moneda */
  id: ULID;
  /** Código ISO (USD, VES, EUR) */
  code: string;
  /** Nombre de la moneda */
  name: string;
  /** Símbolo ($, €, Bs) */
  symbol: string;
  /** Decimales (2 para USD, 2 para VES) */
  decimal_precision: number;
  /** Posición del símbolo */
  symbol_position: 'prefix' | 'suffix';
  /** Separador de miles (.,) */
  thousand_separator: string;
  /** Separador decimal (.,) */
  decimal_separator: string;
  /** Moneda activa en el sistema */
  is_active: boolean;
  /** Fecha de creación */
  created_at?: string;
  /** Fecha de actualización */
  updated_at?: string;
}

/** Tasa de cambio entre monedas */
export interface ExchangeRate {
  /** ULID de la tasa */
  id: ULID;
  /** Moneda origen */
  from_currency: Currency;
  from_currency_id: ULID;
  /** Moneda destino */
  to_currency: Currency;
  to_currency_id: ULID;
  /** Tasa de cambio (1 USD = 35.5 VES) */
  rate: number;
  /** Fuente de la tasa (BCV, paralelo, manual) */
  source: 'official' | 'parallel' | 'manual' | 'average';
  /** Fecha efectiva de la tasa */
  effective_date: string;
  /** Fecha de expiración (null si no expira) */
  expiry_date?: string | null;
  /** Tasa activa */
  is_active: boolean;
  /** Fecha de creación */
  created_at?: string;
  /** Fecha de actualización */
  updated_at?: string;
}

// =============================================================================
// PAYMENT METHOD TYPES
// =============================================================================

/** Campo de metadata requerido para un método de pago */
export interface MetadataField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'number' | 'textarea';
  options?: string[];
  default?: string;
  required?: boolean;
  placeholder?: string;
  help_text?: string;
}

/** Categoría de método de pago */
export interface PaymentCategory {
  /** ULID de la categoría */
  id: ULID;
  /** Nombre (Transferencia, Billetera Digital) */
  name: string;
  /** Slug único */
  slug: string;
  /** Icono (lucide name) */
  icon: string;
  /** Orden de visualización */
  sort_order: number;
  /** Categoría activa */
  is_active: boolean;
}

/** Tipo de pago (bancario, wallet, etc.) */
export interface PaymentTypeOption {
  /** ULID del tipo */
  id: ULID;
  /** Nombre del tipo */
  name: string;
  /** Slug único */
  slug: string;
  /** Descripción del tipo */
  description: string;
  /** Orden de visualización */
  sort_order: number;
  /** Tipo activo */
  is_active: boolean;
}

/** 
 * PaymentMethodTemplate - Catálogo GLOBAL de plantillas
 * Solo STAFF puede gestionar. Son las "marcas": Zelle, Binance, PagoMovil
 */
export interface PaymentMethodTemplate {
  /** ULID de la plantilla */
  id: ULID;
  /** Nombre visible ("Zelle", "Binance Pay") */
  name: string;
  /** Slug único */
  slug: string;
  /** URL del logo */
  logo: string;
  /** Color de marca (hex) */
  brand_color: string;
  /** Moneda por defecto */
  currency: Currency | null;
  currency_id?: ULID;
  /** Categoría del método */
  category: PaymentCategory;
  category_id?: ULID;
  /** Tipo de pago */
  payment_type: PaymentTypeOption;
  payment_type_id?: ULID;
  /** Descripción del método */
  description: string;
  /** Orden de visualización */
  sort_order: number;
  /** Plantilla activa */
  is_active: boolean;
  /** Metadata requerida (campos que el usuario debe llenar) */
  required_metadata: string | { fields: MetadataField[] };
  /** Fecha de creación */
  created_at?: string;
  /** Fecha de actualización */
  updated_at?: string;
  /** Index signature para compatibilidad con Record */
  [key: string]: unknown;
}

/**
 * SaasPaymentMethod - Métodos de pago del SaaS para cobrar suscripciones
 * STAFF configura sus cuentas bancarias. Tenants las ven para pagar suscripción.
 */
export interface SaasPaymentMethod {
  /** ULID del método */
  id: ULID;
  /** Plantilla base */
  template: PaymentMethodTemplate;
  template_id: ULID;
  /** Datos bancarios del STAFF (solo Staff puede ver) */
  staff_account_data: Record<string, string>;
  /** Nombre público que ve el Tenant ("Pagar a: Efectivo 360") */
  display_name: string;
  /** Instrucciones públicas para el Tenant */
  display_instructions: string;
  /** Método activo */
  is_active: boolean;
  /** Orden de visualización */
  sort_order: number;
  /** Disponible para todos los tenants */
  available_for_all_tenants: boolean;
  /** Requiere verificación manual del pago */
  requires_verification: boolean;
  /** Monto máximo para confirmación automática (null = siempre manual) */
  auto_confirm_threshold?: number | null;
  /** Fecha de creación */
  created_at?: string;
  /** Fecha de actualización */
  updated_at?: string;
}

/** Vista filtrada del Tenant de los métodos SaaS (sin datos bancarios) */
export interface TenantSaasPaymentMethodView {
  id: ULID;
  template: PaymentMethodTemplate;
  display_name: string;
  display_instructions: string;
  is_active: boolean;
  sort_order: number;
  requires_verification: boolean;
}

/**
 * TenantPaymentMethod - Métodos de pago del Tenant para cobrar a clientes
 * Cada Tenant configura sus propias cuentas basadas en plantillas globales.
 */
export interface TenantPaymentMethod {
  /** ULID del método */
  id: ULID;
  /** ULID del tenant */
  tenant_id: ULID;
  /** Plantilla base */
  template: PaymentMethodTemplate;
  template_id: ULID;
  /** Datos de cuenta del Tenant (email, teléfono, etc.) */
  account_data: Record<string, string>;
  /** Nombre público para los clientes */
  display_name: string;
  /** Instrucciones para el cliente */
  display_instructions: string;
  /** Método activo */
  is_active: boolean;
  /** Orden de visualización */
  sort_order: number;
  /** % Comisión del método (null = sin comisión) */
  commission_rate?: number | null;
  /** Monto mínimo aceptado */
  minimum_amount?: number | null;
  /** Monto máximo aceptado */
  maximum_amount?: number | null;
  /** Requiere confirmación manual del Tenant */
  requires_confirmation: boolean;
  /** Tiempo máximo de espera para confirmación (minutos) */
  confirmation_time_minutes?: number | null;
  /** Fecha de creación */
  created_at?: string;
  /** Fecha de actualización */
  updated_at?: string;
  /** Index signature para compatibilidad con Record */
  [key: string]: unknown;
}

/** Vista pública de un método de pago (lo que ve el cliente en checkout) */
export interface PublicPaymentMethodView {
  id: ULID;
  template: PaymentMethodTemplate;
  display_name: string;
  display_instructions: string;
  minimum_amount?: number | null;
  maximum_amount?: number | null;
  requires_confirmation: boolean;
}

// =============================================================================
// PAYMENT TRANSACTION TYPES
// =============================================================================

/** Transacción de pago */
export interface PaymentTransaction {
  /** ULID de la transacción */
  id: ULID;
  /** ULID del tenant (si aplica) */
  tenant_id?: ULID;
  /** ULID del método de pago usado */
  payment_method_id: ULID;
  /** Información del método usado */
  payment_method: TenantPaymentMethod | SaasPaymentMethod;
  /** Tipo de transacción */
  type: 'subscription' | 'pos_sale' | 'refund' | 'transfer';
  /** Monto en la moneda original */
  amount: number;
  /** Moneda del monto */
  currency: Currency;
  currency_id: ULID;
  /** Monto convertido a moneda base del tenant (si aplica) */
  converted_amount?: number | null;
  /** Tasa de conversión usada */
  exchange_rate?: number | null;
  /** Estado de la transacción */
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  /** Referencia externa (ID de transferencia, etc.) */
  external_reference?: string;
  /** Metadata adicional del pago */
  metadata?: Record<string, unknown>;
  /** Fecha de creación */
  created_at: string;
  /** Fecha de actualización */
  updated_at?: string;
  /** Fecha de completado */
  completed_at?: string | null;
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

/** Datos para crear/editar una moneda */
export interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  decimal_precision: number;
  symbol_position: 'prefix' | 'suffix';
  thousand_separator: string;
  decimal_separator: string;
}

/** Datos para crear/editar una tasa de cambio */
export interface ExchangeRateFormData {
  from_currency_id: ULID;
  to_currency_id: ULID;
  rate: number;
  source: 'official' | 'parallel' | 'manual' | 'average';
  effective_date: string;
  expiry_date?: string | null;
  is_active: boolean;
}

/** Datos para crear/editar una plantilla de método de pago */
export interface PaymentMethodTemplateFormData {
  name: string;
  slug?: string;
  logo?: File;
  brand_color: string;
  currency_id: ULID;
  category_id: ULID;
  payment_type_id: ULID;
  description: string;
  sort_order: number;
  is_active: boolean;
  required_metadata: string | { fields: MetadataField[] };
}

/** Datos para crear/editar un método de pago SaaS */
export interface SaasPaymentMethodFormData {
  template_id: ULID;
  staff_account_data: Record<string, string>;
  display_name: string;
  display_instructions: string;
  is_active: boolean;
  sort_order: number;
  available_for_all_tenants: boolean;
  requires_verification: boolean;
  auto_confirm_threshold?: number | null;
}

/** Datos para crear/editar un método de pago de Tenant */
export interface TenantPaymentMethodFormData {
  template_id: ULID;
  account_data: Record<string, string>;
  display_name: string;
  display_instructions: string;
  is_active: boolean;
  sort_order: number;
  commission_rate?: number | null;
  minimum_amount?: number | null;
  maximum_amount?: number | null;
  requires_confirmation: boolean;
  confirmation_time_minutes?: number | null;
}

// =============================================================================
// PAYMENT CONFIGURATION TYPES
// =============================================================================

/** Configuración de pagos de un tenant */
export interface TenantPaymentConfig {
  /** Moneda base del tenant */
  default_currency: Currency;
  default_currency_id: ULID;
  /** Monedas aceptadas para pagos */
  accepted_currencies: Currency[];
  /** Métodos de pago configurados */
  payment_methods: TenantPaymentMethod[];
  /** Tasas de cambio activas */
  active_exchange_rates: ExchangeRate[];
}

/** Configuración global de pagos del sistema */
export interface GlobalPaymentConfig {
  /** Monedas disponibles en el sistema */
  currencies: Currency[];
  /** Plantillas de métodos de pago globales */
  templates: PaymentMethodTemplate[];
  /** Categorías de pago */
  categories: PaymentCategory[];
  /** Tipos de pago */
  payment_types: PaymentTypeOption[];
  /** Métodos SaaS para pagar suscripciones */
  saas_payment_methods: TenantSaasPaymentMethodView[];
}

// =============================================================================
// FILTER & PAGINATION TYPES
// =============================================================================

/** Filtros para listar métodos de pago */
export interface PaymentMethodFilters {
  category?: string;
  type?: string;
  is_active?: boolean;
  currency_id?: ULID;
}

/** Filtros para listar transacciones */
export interface TransactionFilters {
  status?: PaymentTransaction['status'];
  type?: PaymentTransaction['type'];
  payment_method_id?: ULID;
  date_from?: string;
  date_to?: string;
  currency_id?: ULID;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Nivel de validación de un método de pago */
export type PaymentValidationLevel = 'none' | 'basic' | 'strict';

/** Resultado de una conversión de moneda */
export interface CurrencyConversionResult {
  /** Monto original */
  original_amount: number;
  /** Moneda origen */
  from_currency: Currency;
  /** Moneda destino */
  to_currency: Currency;
  /** Monto convertido */
  converted_amount: number;
  /** Tasa usada */
  rate: number;
  /** Fecha de la tasa */
  rate_date: string;
}

/** Estado de disponibilidad de un método para un monto */
export interface PaymentMethodAvailability {
  /** Método disponible */
  available: boolean;
  /** Razón si no está disponible */
  reason?: string;
  /** Monto mínimo aceptado */
  minimum_amount?: number;
  /** Monto máximo aceptado */
  maximum_amount?: number;
  /** Comisión estimada */
  estimated_commission?: number;
}
