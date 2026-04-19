// =============================================================================
// CURRENCY TYPES - API-Driven, NO hardcoded values
// =============================================================================

export interface CurrencyFormatRules {
  code: string;
  symbol: string;
  decimal_precision: number;
  symbol_position: 'prefix' | 'suffix';
  thousand_separator: string;
  decimal_separator: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimal_precision: number;
  symbol_position: 'prefix' | 'suffix';
  thousand_separator: string;
  decimal_separator: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// PAYMENT METHODS TYPES - SEPARACIÓN LIMPIA DE RESPONSABILIDADES
// =============================================================================

export interface MetadataField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'number';
  options?: string[];
  default?: string;
  required?: boolean;
}

export interface PaymentCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface PaymentTypeOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

// ============================================================================
// MODELO 1: PaymentMethodTemplate
// Catálogo GLOBAL de plantillas - Solo STAFF puede gestionar
// Son las "marcas" de métodos de pago: Zelle, Binance, PagoMovil, etc.
// ============================================================================
export interface PaymentMethodTemplate {
  id: number;
  name: string;
  slug: string;
  logo: string;
  brand_color: string;
  // FK Relations (GET devuelve objetos anidados, POST usa _id)
  currency: Currency | null;
  category: PaymentCategory;
  payment_type: PaymentTypeOption;
  // IDs para POST/PUT (write_only en serializer)
  currency_id?: number;
  category_id?: number;
  payment_type_id?: number;
  description: string;
  sort_order: number;
  is_active: boolean;
  required_metadata: string | { fields: MetadataField[] };
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// MODELO 2: SaasPaymentMethod
// Métodos de pago del SaaS para cobrar suscripciones a los Tenants
// Relación: STAFF (provee) <- TEMPLATE (método) -> TENANT (usa para pagar)
// Cada Tenant ve estos métodos en "Planes y Licencias" para pagar su suscripción
// ============================================================================
export interface SaasPaymentMethod {
  id: number;
  template: PaymentMethodTemplate;
  template_id: number;
  // Datos bancarios del STAFF - Solo el Staff puede ver/editar estos
  staff_account_data: Record<string, string>;
  // Datos públicos que el Tenant ve (ej: "Pagar a: Efectivo 360 LLC")
  display_name: string;
  display_instructions: string;
  // Configuración
  is_active: boolean;
  sort_order: number;
  available_for_all_tenants: boolean;
  // Metadata de configuración específica del SaaS
  requires_verification: boolean;
  auto_confirm_threshold?: number; // Monto máximo para confirmación automática
  created_at?: string;
  updated_at?: string;
}

// Vista del Tenant (datos filtrados - SIN datos bancarios del Staff)
export interface TenantSaasPaymentMethodView {
  id: number;
  template: PaymentMethodTemplate;
  display_name: string;
  display_instructions: string;
  is_active: boolean;
  sort_order: number;
  requires_verification: boolean;
}

// ============================================================================
// MODELO 3: TenantPaymentMethod
// Métodos de pago que cada Tenant configura para cobrar a SUS clientes en el POS
// Relación: TENANT (tienda) <- TEMPLATE (método) -> CLIENTE_FINAL (paga)
// Cada Tenant gestiona sus propias cuentas bancarias/destinatarios
// ============================================================================
export interface TenantPaymentMethod {
  id: number;
  tenant_id: number;
  template: PaymentMethodTemplate;
  template_id: number;
  // Datos bancarios/configuración específica del TENANT
  // Ej: { "email": "mi-tienda@email.com", "phone": "0414..." }
  account_data: Record<string, string>;
  // Datos públicos que los clientes ven en el checkout
  display_name: string;
  display_instructions: string;
  // Configuración del Tenant
  is_active: boolean;
  sort_order: number;
  // Configuración avanzada
  commission_rate?: number; // % de comisión si aplica
  minimum_amount?: number;
  maximum_amount?: number;
  requires_confirmation: boolean;
  confirmation_time_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

// Vista pública (lo que ve el cliente final en el POS)
export interface PublicPaymentMethodView {
  id: number;
  template: PaymentMethodTemplate;
  display_name: string;
  display_instructions: string;
  minimum_amount?: number;
  maximum_amount?: number;
  requires_confirmation: boolean;
}

// ============================================================================
// FORM DATA TYPES - Para crear/editar
// ============================================================================

export interface PaymentMethodTemplateFormData {
  name: string;
  slug?: string;
  logo?: File;
  brand_color: string;
  default_currency: 'USD' | 'VES';
  category: string;
  payment_type: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  required_metadata: string | { fields: MetadataField[] };
  currency_id?: number;
  payment_category_id?: number;
}

export interface SaasPaymentMethodFormData {
  template_id: number;
  staff_account_data: Record<string, string>;
  display_name: string;
  display_instructions: string;
  is_active: boolean;
  sort_order: number;
  available_for_all_tenants: boolean;
  requires_verification: boolean;
  auto_confirm_threshold?: number;
}

export interface TenantPaymentMethodFormData {
  template_id: number;
  account_data: Record<string, string>;
  display_name: string;
  display_instructions: string;
  is_active: boolean;
  sort_order: number;
  commission_rate?: number;
  minimum_amount?: number;
  maximum_amount?: number;
  requires_confirmation: boolean;
  confirmation_time_minutes?: number;
}

// ============================================================================
// TYPES LEGACY - Mantener temporalmente para compatibilidad
// @deprecated Usar PaymentMethodTemplate en lugar de GlobalPaymentMethod
// ============================================================================
/** @deprecated Usar PaymentMethodTemplate */
export interface GlobalPaymentMethod extends PaymentMethodTemplate {}

// =============================================================================
// BOOTSTRAP CONFIG - Initial load from API
// =============================================================================

export interface TenantConfig {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  default_currency_code: string;
  default_language: string;
  features: string[];
}

export interface GlobalConfig {
  tenant: TenantConfig;
  currencies: Currency[];
  payment_categories: PaymentCategory[];
  payment_types: PaymentTypeOption[];
  icons: Record<string, string>; // icon_name -> SVG path or component name
  ui_config: {
    primary_color: string;
    logo_url: string;
    favicon_url: string;
  };
}

// =============================================================================
// GEOGRAPHY TYPES - API-Driven, NO hardcoded values
// =============================================================================

export interface Country {
  id: number;
  ulid: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface State {
  id: number;
  ulid: string;
  name: string;
  code: string;
  country: number;
  country_ulid?: string;
  country_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface City {
  id: number;
  ulid: string;
  name: string;
  code: string;
  country: number;
  country_ulid?: string;
  country_name?: string;
  state: number;
  state_ulid?: string;
  state_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// COUNTRY CURRENCY CONFIG TYPES - API-Driven, NO hardcoded values
// =============================================================================

export interface CountryCurrencyConfig {
  id: number;
  country: number;
  country_name?: string;
  currency: number;
  currency_code?: string;
  currency_name?: string;
  is_legal_tender: boolean;
  is_price_base: boolean;
  priority_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CountryCurrencyFormData {
  country: number;
  currency: number;
  is_legal_tender: boolean;
  is_price_base: boolean;
  priority_order: number;
  is_active: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
