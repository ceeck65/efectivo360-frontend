/**
 * @fileoverview Tipos del módulo Vaults
 * @module @modules/vaults/types
 */

// =============================================================================
// VAULT TYPES
// =============================================================================

export interface Vault {
  id: string;
  code: string;
  tenant?: string | null;
  is_template: boolean;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  vault_type: VaultType;
  default_currency: string;
  max_capacity?: number | null;
  requires_authorization: boolean;
  allowed_roles: string[];
  countries: string[];
  financial_rules: FinancialRules;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type VaultType = 
  | 'CASH'
  | 'SAFE'
  | 'TERMINAL'
  | 'MOBILE'
  | 'PETTY'
  | 'BANK'
  | 'CRYPTO'
  | 'CUSTOM';

export interface FinancialRules {
  min_amount?: number;
  max_amount?: number;
  monthly_limit?: number;
  approval_required_over?: number;
  allowed_currencies?: string[];
  subscription_only?: boolean;
  requires_invoice?: boolean;
  daily_limit?: number;
  transaction_count_limit?: number;
  [key: string]: any;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface VaultCreateRequest {
  code: string;
  is_template: boolean;
  tenant?: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  vault_type: VaultType;
  default_currency: string;
  max_capacity?: number;
  requires_authorization: boolean;
  allowed_roles: string[];
  countries: string[];
  financial_rules: FinancialRules;
}

export interface VaultUpdateRequest extends Partial<VaultCreateRequest> {}

export interface VaultCloneRequest {
  tenant_id: string;
  override_data?: Partial<VaultCreateRequest>;
}

export interface VaultValidationRequest {
  tenant_currency: string;
}

export interface VaultValidationResponse {
  valid: boolean;
  errors?: string[];
  message?: string;
}

// =============================================================================
// COMPONENT TYPES
// =============================================================================

export interface VaultTemplateModalProps {
  vault?: Vault | null;
}

export interface VaultCustomModalProps {
  vault?: Vault | null;
}

export interface VaultDetailsModalProps {
  vault: Vault;
}

export interface CloneVaultModalProps {
  vault: Vault;
}

export interface VaultTemplateViewModalProps {
  vault: Vault;
}

// =============================================================================
// STORE TYPES
// =============================================================================

export interface VaultState {
  vaults: Vault[];
  templates: Vault[];
  loading: boolean;
  error: string | null;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface VaultFilters {
  search?: string;
  type?: VaultType;
  status?: boolean;
  currency?: string;
}

// =============================================================================
// STATS TYPES
// =============================================================================

export interface VaultStats {
  total: number;
  active: number;
  inactive: number;
  custom: number;
  by_type: Record<VaultType, number>;
  by_currency: Record<string, number>;
}

// =============================================================================
// UTILS TYPES
// =============================================================================

export type VaultIconConfig = {
  [K in VaultType]: string;
};

export type VaultTypeConfig = {
  [K in VaultType]: {
    name: string;
    description: string;
    icon: string;
    color: string;
  };
};
