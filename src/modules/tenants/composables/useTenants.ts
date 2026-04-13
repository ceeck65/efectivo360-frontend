/**
 * @fileoverview Composable principal del módulo Tenants
 * @module @modules/tenants/composables/useTenants
 * 
 * Lógica de gestión de comercios, registro y activación de tiendas.
 * Integración con validación SENIAT.
 */

import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import { useTenantsStore } from '../stores/tenantsStore';
import type {
  Tenant,
  TenantCreateData,
  TenantUpdateData,
  TenantActivationData,
  TenantFilters,
  TaxIdType,
  TenantType,
} from '../types';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useTenants() {
  const store = useTenantsStore();
  const {
    tenants,
    totalTenants,
    currentTenant,
    tenantTypes,
    isLoading,
    isLoadingTypes,
    registration,
    seniatValidation,
    isValidatingSeniat,
  } = storeToRefs(store);

  // Local state
  const filters = ref<TenantFilters>({});
  const selectedTenantId = ref<string | null>(null);

  // Getters
  const selectedTenant = computed(() => 
    selectedTenantId.value 
      ? store.getTenantById(selectedTenantId.value)
      : null
  );

  const hasActiveFilters = computed(() => 
    Object.values(filters.value).some(v => v !== undefined && v !== '')
  );

  // =============================================================================
  // LIST & FILTER
  // =============================================================================

  /**
   * Cargar comercios con filtros actuales
   */
  async function loadTenants(page: number = 1): Promise<void> {
    store.currentPage = page;
    await store.loadTenants(filters.value);
  }

  /**
   * Actualizar filtros y recargar
   */
  async function updateFilters(newFilters: TenantFilters): Promise<void> {
    filters.value = { ...filters.value, ...newFilters };
    store.currentPage = 1;
    await loadTenants();
  }

  /**
   * Limpiar filtros
   */
  async function clearFilters(): Promise<void> {
    filters.value = {};
    store.currentPage = 1;
    await loadTenants();
  }

  /**
   * Cambiar página
   */
  async function changePage(page: number): Promise<void> {
    await loadTenants(page);
  }

  // =============================================================================
  // CRUD
  // =============================================================================

  /**
   * Seleccionar comercio
   */
  function selectTenant(id: string | null): void {
    selectedTenantId.value = id;
    if (id) {
      store.loadTenantById(id);
    }
  }

  /**
   * Crear comercio
   */
  async function createTenant(data: TenantCreateData): Promise<Tenant | null> {
    return await store.createTenant(data);
  }

  /**
   * Actualizar comercio
   */
  async function updateTenant(
    id: string,
    data: TenantUpdateData
  ): Promise<boolean> {
    return await store.updateTenant(id, data);
  }

  /**
   * Suspender comercio
   */
  async function suspendTenant(id: string, reason?: string): Promise<boolean> {
    return await store.suspendTenant(id, reason);
  }

  /**
   * Reactivar comercio
   */
  async function reactivateTenant(id: string): Promise<boolean> {
    return await store.reactivateTenant(id);
  }

  // =============================================================================
  // TENANT TYPES
  // =============================================================================

  /**
   * Cargar tipos de comercio
   */
  async function loadTenantTypes(): Promise<void> {
    await store.loadTenantTypes();
  }

  /**
   * Obtener tipo por ID
   */
  function getTenantType(id: string): TenantType | null {
    return store.getTenantTypeById(id);
  }

  // =============================================================================
  // REGISTRATION FLOW
  // =============================================================================

  /**
   * Validar RIF en SENIAT (Paso 1)
   */
  async function validateTaxId(
    taxIdType: TaxIdType,
    taxId: string
  ): Promise<boolean> {
    const isValid = await store.validateTaxId(taxIdType, taxId);
    if (isValid) {
      store.nextRegistrationStep();
    }
    return isValid;
  }

  /**
   * Configurar datos básicos (Paso 2)
   */
  function setBasicInfo(
    name: string,
    legalName: string,
    tenantTypeId: string
  ): void {
    store.updateRegistrationData({
      name,
      legalName,
      tenantTypeId,
    });
    store.nextRegistrationStep();
  }

  /**
   * Configurar contacto (Paso 3)
   */
  function setContactInfo(
    email: string,
    phone?: string,
    address?: string
  ): void {
    store.updateRegistrationData({
      email,
      phone,
      address,
    });
    store.nextRegistrationStep();
  }

  /**
   * Finalizar registro y activar (Paso 4)
   */
  async function completeRegistration(
    activationData: Omit<TenantActivationData, 'tenantId'>
  ): Promise<{ success: boolean; tokens?: { access: string; refresh: string } }> {
    if (!registration.value.taxId || !registration.value.name) {
      toast.error('Datos de registro incompletos');
      return { success: false };
    }

    // Primero crear el tenant
    const createData: TenantCreateData = {
      name: registration.value.name,
      legalName: registration.value.legalName || registration.value.name,
      taxIdType: registration.value.taxIdType!,
      taxId: registration.value.taxId,
      email: registration.value.email!,
      phone: registration.value.phone,
      tenantTypeId: registration.value.tenantTypeId!,
      address: registration.value.address,
    };

    const tenant = await createTenant(createData);
    
    if (!tenant) {
      return { success: false };
    }

    // Luego activarlo
    const result = await store.activateTenant({
      tenantId: tenant.id,
      ...activationData,
    });

    if (result.success) {
      store.resetRegistration();
    }

    return result;
  }

  /**
   * Cancelar registro
   */
  function cancelRegistration(): void {
    store.resetRegistration();
  }

  /**
   * Retroceder paso
   */
  function goBack(): void {
    store.prevRegistrationStep();
  }

  // =============================================================================
  // STATS
  // =============================================================================

  /**
   * Cargar estadísticas
   */
  async function loadStats(): Promise<void> {
    await store.loadStats();
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    tenants,
    totalTenants,
    currentTenant,
    tenantTypes,
    isLoading,
    isLoadingTypes,
    registration,
    seniatValidation,
    isValidatingSeniat,
    filters,
    selectedTenantId,
    
    // Getters
    selectedTenant,
    hasActiveFilters,
    registrationProgress: computed(() => store.registrationProgress),
    
    // List
    loadTenants,
    updateFilters,
    clearFilters,
    changePage,
    
    // CRUD
    selectTenant,
    createTenant,
    updateTenant,
    suspendTenant,
    reactivateTenant,
    
    // Types
    loadTenantTypes,
    getTenantType,
    
    // Registration
    validateTaxId,
    setBasicInfo,
    setContactInfo,
    completeRegistration,
    cancelRegistration,
    goBack,
    
    // Stats
    loadStats,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para registro rápido
 */
export function useTenantRegistration() {
  const store = useTenantsStore();
  const { registration, seniatValidation, isValidatingSeniat } = storeToRefs(store);

  return {
    // State
    currentStep: computed(() => registration.value.step),
    taxIdData: computed(() => ({
      type: registration.value.taxIdType,
      number: registration.value.taxId,
    })),
    basicInfo: computed(() => ({
      name: registration.value.name,
      legalName: registration.value.legalName,
      tenantTypeId: registration.value.tenantTypeId,
    })),
    contactInfo: computed(() => ({
      email: registration.value.email,
      phone: registration.value.phone,
      address: registration.value.address,
    })),
    seniatData: seniatValidation,
    isValidating: isValidatingSeniat,
    canProceed: computed(() => store.canProceedStep(registration.value.step)),
    
    // Actions
    validateTaxId: store.validateTaxId,
    nextStep: store.nextRegistrationStep,
    prevStep: store.prevRegistrationStep,
    updateData: store.updateRegistrationData,
    reset: store.resetRegistration,
  };
}
