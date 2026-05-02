/**
 * @fileoverview Composables del módulo Vaults
 * @module @modules/vaults/composables
 */

import { ref, computed, reactive } from 'vue';
import { vaultsService } from '../services';

// Toast notification (usando console.log como fallback)
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implementar toast cuando vue-toastification esté disponible
};
import type { 
  Vault, 
  VaultFilters, 
  VaultCreateRequest, 
  VaultUpdateRequest,
  VaultCloneRequest,
  VaultValidationRequest,
  VaultStats,
  VaultType
} from '../types';

// =============================================================================
// COMPOSABLES
// =============================================================================

/**
 * Composable para gestión de vaults
 */
export function useVaults() {
  
  // State
  const vaults = ref<Vault[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = reactive<VaultFilters>({});

  // Computed
  const filteredVaults = computed(() => {
    let filtered = vaults.value;

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(vault => 
        vault.name.toLowerCase().includes(query) ||
        vault.code.toLowerCase().includes(query) ||
        vault.description.toLowerCase().includes(query)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(vault => vault.vault_type === filters.type);
    }

    if (filters.status !== undefined) {
      filtered = filtered.filter(vault => vault.is_active === filters.status);
    }

    return filtered;
  });

  const stats = computed<VaultStats>(() => ({
    total: vaults.value.length,
    active: vaults.value.filter(v => v.is_active).length,
    inactive: vaults.value.filter(v => !v.is_active).length,
    custom: vaults.value.filter(v => v.vault_type === 'CUSTOM').length,
    by_type: vaults.value.reduce((acc, vault) => {
      acc[vault.vault_type] = (acc[vault.vault_type] || 0) + 1;
      return acc;
    }, {} as Record<VaultType, number>),
    by_currency: vaults.value.reduce((acc, vault) => {
      acc[vault.default_currency] = (acc[vault.default_currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }));

  // Methods
  const loadVaults = async (isTemplateMode = false) => {
    try {
      loading.value = true;
      error.value = null;
      
      const data = isTemplateMode 
        ? await vaultsService.getTemplates(filters)
        : await vaultsService.getMyVaults(filters);
      
      vaults.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading vaults';
      showToast(error.value, 'error');
    } finally {
      loading.value = false;
    }
  };

  const createVault = async (data: VaultCreateRequest) => {
    try {
      loading.value = true;
      const newVault = await vaultsService.createVault(data);
      vaults.value.push(newVault);
      showToast('Vault creado exitosamente');
      return newVault;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error creating vault';
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateVault = async (id: string, data: VaultUpdateRequest) => {
    try {
      loading.value = true;
      const updatedVault = await vaultsService.updateVault(id, data);
      const index = vaults.value.findIndex(v => v.id === id);
      if (index !== -1) {
        vaults.value[index] = updatedVault;
      }
      showToast('Vault actualizado exitosamente');
      return updatedVault;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error updating vault';
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteVault = async (id: string) => {
    try {
      loading.value = true;
      await vaultsService.deleteVault(id);
      vaults.value = vaults.value.filter(v => v.id !== id);
      showToast('Vault eliminado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error deleting vault';
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const cloneVault = async (id: string, data: VaultCloneRequest) => {
    try {
      loading.value = true;
      const clonedVault = await vaultsService.cloneVault(id, data);
      vaults.value.push(clonedVault);
      showToast('Vault clonado exitosamente');
      return clonedVault;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error cloning vault';
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const validateVault = async (id: string, data: VaultValidationRequest) => {
    try {
      const result = await vaultsService.validateVault(id, data);
      if (result.valid) {
        showToast('Vault validado exitosamente');
      } else {
        showToast('Vault no cumple las reglas de validación', 'error');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error validating vault';
      showToast(errorMsg, 'error');
      throw err;
    }
  };

  const refreshVaults = () => {
    loadVaults();
  };

  const clearFilters = () => {
    Object.assign(filters, {});
  };

  return {
    // State
    vaults,
    loading,
    error,
    filters,
    
    // Computed
    filteredVaults,
    stats,
    
    // Methods
    loadVaults,
    createVault,
    updateVault,
    deleteVault,
    cloneVault,
    validateVault,
    refreshVaults,
    clearFilters,
  };
}

/**
 * Composable para gestión de templates de vaults (solo staff)
 */
export function useVaultTemplates() {
  const vaultsComposable = useVaults();
  
  const loadTemplates = () => {
    return vaultsComposable.loadVaults(true);
  };

  const createTemplate = async (data: VaultCreateRequest) => {
    return vaultsComposable.createVault({ ...data, is_template: true, tenant: undefined });
  };

  const cloneTemplateToTenant = async (templateId: string, tenantId: string, overrideData?: Partial<VaultCreateRequest>) => {
    return vaultsComposable.cloneVault(templateId, { 
      tenant_id: tenantId, 
      override_data: overrideData 
    });
  };

  return {
    ...vaultsComposable,
    loadTemplates,
    createTemplate,
    cloneTemplateToTenant,
  };
}

/**
 * Composable para utilidades de vaults
 */
export function useVaultUtils() {
  const getVaultIcon = (type: VaultType) => {
    const icons = {
      CASH: 'DollarSign',
      SAFE: 'Shield',
      TERMINAL: 'CreditCard',
      MOBILE: 'Smartphone',
      PETTY: 'Wallet',
      BANK: 'Building2',
      CRYPTO: 'Bitcoin',
      CUSTOM: 'Settings',
    };
    return icons[type] || 'Archive';
  };

  const getVaultTypeName = (type: VaultType) => {
    const names = {
      CASH: 'Caja de Efectivo',
      SAFE: 'Caja Fuerte',
      TERMINAL: 'Terminal de Pago',
      MOBILE: 'Caja Móvil',
      PETTY: 'Caja Chica',
      BANK: 'Bóveda del Banco',
      CRYPTO: 'Bóveda Cripto',
      CUSTOM: 'Personalizado',
    };
    return names[type] || type;
  };

  const getVaultTypeColor = (type: VaultType) => {
    const colors = {
      CASH: 'green',
      SAFE: 'blue',
      TERMINAL: 'purple',
      MOBILE: 'orange',
      PETTY: 'yellow',
      BANK: 'indigo',
      CRYPTO: 'pink',
      CUSTOM: 'gray',
    };
    return colors[type] || 'gray';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'VES' ? 'VES' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const validateFinancialRules = (rules: any) => {
    const errors: string[] = [];
    
    if (rules.min_amount && rules.max_amount && rules.min_amount > rules.max_amount) {
      errors.push('El monto mínimo no puede ser mayor al monto máximo');
    }
    
    if (rules.monthly_limit && rules.monthly_limit <= 0) {
      errors.push('El límite mensual debe ser mayor a 0');
    }
    
    if (rules.daily_limit && rules.daily_limit <= 0) {
      errors.push('El límite diario debe ser mayor a 0');
    }
    
    if (rules.approval_required_over && rules.approval_required_over <= 0) {
      errors.push('El monto para aprobación debe ser mayor a 0');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  };

  return {
    getVaultIcon,
    getVaultTypeName,
    getVaultTypeColor,
    formatCurrency,
    validateFinancialRules,
  };
}
