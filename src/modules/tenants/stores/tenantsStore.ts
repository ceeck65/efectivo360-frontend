/**
 * @fileoverview Store de Pinia para Tenants (Comercios)
 * @module @modules/tenants/stores/tenantsStore
 * 
 * Estado reactivo de comercios, tipos de comercio y proceso de registro.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type {
  Tenant,
  TenantType,
  TenantCreateData,
  TenantUpdateData,
  TenantActivationData,
  TenantFilters,
  TenantStats,
  SeniatTaxpayerInfo,
  TenantRegistration,
  TaxIdType,
} from '../types';
import * as tenantsService from '../services/tenants.service';

export const useTenantsStore = defineStore('tenants', () => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  // Listado
  const tenants = ref<Tenant[]>([]);
  const totalTenants = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);

  // Tenant actual (seleccionado/detalle)
  const currentTenant = ref<Tenant | null>(null);
  
  // Tipos de comercio
  const tenantTypes = ref<TenantType[]>([]);
  
  // Stats
  const stats = ref<TenantStats | null>(null);
  
  // UI State
  const isLoading = ref(false);
  const isLoadingTypes = ref(false);
  const error = ref<string | null>(null);
  
  // Proceso de registro
  const registration = ref<TenantRegistration>({
    step: 1,
    agreedToTerms: false,
  });
  
  // Validación SENIAT
  const seniatValidation = ref<SeniatTaxpayerInfo | null>(null);
  const isValidatingSeniat = ref(false);

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  const activeTenants = computed(() => 
    tenants.value.filter(t => t.status === 'active')
  );
  
  const pendingTenants = computed(() => 
    tenants.value.filter(t => t.status === 'pending')
  );
  
  const getTenantById = computed(() => (id: string) => 
    tenants.value.find(t => t.id === id) || null
  );
  
  const getTenantTypeById = computed(() => (id: string) => 
    tenantTypes.value.find(t => t.id === id) || null
  );
  
  const registrationProgress = computed(() => {
    const steps = [1, 2, 3, 4];
    const current = registration.value.step;
    return {
      current,
      total: steps.length,
      percent: (current / steps.length) * 100,
      canProceed: canProceedStep(current),
    };
  });

  // ==========================================================================
  // ACTIONS - TENANTS LIST
  // ==========================================================================

  /**
   * Cargar listado de comercios
   */
  async function loadTenants(filters?: TenantFilters): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await tenantsService.fetchTenants(
        filters,
        currentPage.value,
        pageSize.value
      );
      tenants.value = response.results;
      totalTenants.value = response.count;
    } catch (err: any) {
      error.value = err.message || 'Error cargando comercios';
      toast.error('Error cargando comercios');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Cargar comercio por ID
   */
  async function loadTenantById(id: string): Promise<boolean> {
    isLoading.value = true;

    try {
      const tenant = await tenantsService.fetchTenantById(id);
      if (tenant) {
        currentTenant.value = tenant;
        return true;
      }
    } catch (err: any) {
      toast.error('Error cargando comercio');
    } finally {
      isLoading.value = false;
    }
    
    return false;
  }

  /**
   * Crear comercio
   */
  async function createTenant(data: TenantCreateData): Promise<Tenant | null> {
    isLoading.value = true;

    try {
      const tenant = await tenantsService.createTenant(data);
      if (tenant) {
        tenants.value.unshift(tenant);
        toast.success('Comercio creado exitosamente');
        return tenant;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creando comercio');
    } finally {
      isLoading.value = false;
    }
    
    return null;
  }

  /**
   * Actualizar comercio
   */
  async function updateTenant(id: string, data: TenantUpdateData): Promise<boolean> {
    isLoading.value = true;

    try {
      const updated = await tenantsService.updateTenant(id, data);
      if (updated) {
        const index = tenants.value.findIndex(t => t.id === id);
        if (index !== -1) {
          tenants.value[index] = { ...tenants.value[index], ...updated };
        }
        if (currentTenant.value?.id === id) {
          currentTenant.value = { ...currentTenant.value, ...updated };
        }
        toast.success('Comercio actualizado');
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error actualizando comercio');
    } finally {
      isLoading.value = false;
    }
    
    return false;
  }

  /**
   * Activar comercio
   */
  async function activateTenant(data: TenantActivationData): Promise<{ success: boolean; tokens?: { access: string; refresh: string } }> {
    isLoading.value = true;

    try {
      const result = await tenantsService.activateTenant(data);
      if (result) {
        toast.success('¡Comercio activado exitosamente!');
        return {
          success: true,
          tokens: {
            access: result.accessToken,
            refresh: result.refreshToken,
          },
        };
      }
    } catch (err: any) {
      toast.error(err.message || 'Error activando comercio');
    } finally {
      isLoading.value = false;
    }
    
    return { success: false };
  }

  /**
   * Suspender comercio
   */
  async function suspendTenant(id: string, reason?: string): Promise<boolean> {
    try {
      const success = await tenantsService.suspendTenant(id, reason);
      if (success) {
        const index = tenants.value.findIndex(t => t.id === id);
        if (index !== -1) {
          tenants.value[index].status = 'suspended';
        }
        toast.success('Comercio suspendido');
      }
      return success;
    } catch {
      toast.error('Error suspendiendo comercio');
      return false;
    }
  }

  /**
   * Reactivar comercio
   */
  async function reactivateTenant(id: string): Promise<boolean> {
    try {
      const success = await tenantsService.reactivateTenant(id);
      if (success) {
        const index = tenants.value.findIndex(t => t.id === id);
        if (index !== -1) {
          tenants.value[index].status = 'active';
        }
        toast.success('Comercio reactivado');
      }
      return success;
    } catch {
      toast.error('Error reactivando comercio');
      return false;
    }
  }

  // ==========================================================================
  // ACTIONS - TENANT TYPES
  // ==========================================================================

  /**
   * Cargar tipos de comercio
   */
  async function loadTenantTypes(): Promise<void> {
    isLoadingTypes.value = true;

    try {
      const types = await tenantsService.fetchTenantTypes();
      tenantTypes.value = types;
    } catch {
      console.error('Error cargando tipos de comercio');
    } finally {
      isLoadingTypes.value = false;
    }
  }

  // ==========================================================================
  // ACTIONS - REGISTRATION FLOW
  // ==========================================================================

  /**
   * Validar RIF en SENIAT
   */
  async function validateTaxId(taxIdType: TaxIdType, taxId: string): Promise<boolean> {
    isValidatingSeniat.value = true;

    try {
      const result = await tenantsService.validateTaxIdInSeniat(taxIdType, taxId);
      
      if (result.isValid && result.taxpayer) {
        seniatValidation.value = result.taxpayer;
        registration.value.taxIdType = taxIdType;
        registration.value.taxId = taxId;
        registration.value.seniatData = result.taxpayer;
        return true;
      } else {
        toast.error(result.error || 'RIF no válido en SENIAT');
        return false;
      }
    } catch {
      toast.error('Error validando en SENIAT');
      return false;
    } finally {
      isValidatingSeniat.value = false;
    }
  }

  /**
   * Avanzar al siguiente paso del registro
   */
  function nextRegistrationStep(): void {
    if (registration.value.step < 4) {
      registration.value.step++;
    }
  }

  /**
   * Retroceder al paso anterior
   */
  function prevRegistrationStep(): void {
    if (registration.value.step > 1) {
      registration.value.step--;
    }
  }

  /**
   * Actualizar datos del registro
   */
  function updateRegistrationData(data: Partial<TenantRegistration>): void {
    registration.value = { ...registration.value, ...data };
  }

  /**
   * Resetear proceso de registro
   */
  function resetRegistration(): void {
    registration.value = {
      step: 1,
      agreedToTerms: false,
    };
    seniatValidation.value = null;
  }

  /**
   * Verificar si puede avanzar de paso
   */
  function canProceedStep(step: number): boolean {
    switch (step) {
      case 1:
        return !!registration.value.taxId && !!registration.value.seniatData;
      case 2:
        return !!registration.value.name && !!registration.value.tenantTypeId;
      case 3:
        return !!registration.value.email;
      case 4:
        return registration.value.agreedToTerms;
      default:
        return false;
    }
  }

  // ==========================================================================
  // ACTIONS - STATS
  // ==========================================================================

  /**
   * Cargar estadísticas
   */
  async function loadStats(): Promise<void> {
    try {
      stats.value = await tenantsService.fetchTenantStats();
    } catch {
      console.error('Error cargando estadísticas');
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    tenants,
    totalTenants,
    currentPage,
    pageSize,
    currentTenant,
    tenantTypes,
    stats,
    isLoading,
    isLoadingTypes,
    error,
    registration,
    seniatValidation,
    isValidatingSeniat,
    
    // Getters
    activeTenants,
    pendingTenants,
    getTenantById,
    getTenantTypeById,
    registrationProgress,
    
    // Actions
    loadTenants,
    loadTenantById,
    createTenant,
    updateTenant,
    activateTenant,
    suspendTenant,
    reactivateTenant,
    loadTenantTypes,
    validateTaxId,
    nextRegistrationStep,
    prevRegistrationStep,
    updateRegistrationData,
    resetRegistration,
    canProceedStep,
    loadStats,
  };
});
