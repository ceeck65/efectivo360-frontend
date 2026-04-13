/**
 * @fileoverview Store Pinia para manejo del contexto de tenant (multi-tenancy)
 * @module @core/stores/tenantStore
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TenantContext, ULID } from '@core/types';

/**
 * Store para gestionar el contexto multi-tenant
 * @returns {Object} Store con estado y acciones del tenant
 */
export const useTenantStore = defineStore('tenant', () => {
  // State
  const tenantId = ref<ULID | null>(null);
  const tenantSlug = ref<string>('');
  const tenantName = ref<string>('');
  const plan = ref<string>('');
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Getters
  const isTenantLoaded = computed(() => tenantId.value !== null);
  
  const currentTenant = computed<TenantContext | null>(() => {
    if (!tenantId.value) return null;
    
    return {
      tenantId: tenantId.value,
      tenantSlug: tenantSlug.value,
      tenantName: tenantName.value,
      plan: plan.value,
    };
  });

  const isProPlan = computed(() => plan.value === 'PRO' || plan.value === 'ENTERPRISE');
  const isEnterprisePlan = computed(() => plan.value === 'ENTERPRISE');

  // Actions
  /**
   * Carga la información del tenant desde el servidor
   * @param {string} slug - Slug del tenant a cargar
   */
  async function loadTenant(slug: string): Promise<void> {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;

    try {
      // En una implementación real, esto haría una petición al API
      // const response = await httpClient.get(`/tenants/${slug}/`);
      
      // Simulación de carga desde localStorage para demo
      const stored = localStorage.getItem(`tenant_${slug}`);
      
      if (stored) {
        const data = JSON.parse(stored) as TenantContext;
        tenantId.value = data.tenantId;
        tenantSlug.value = data.tenantSlug;
        tenantName.value = data.tenantName;
        plan.value = data.plan;
      } else {
        // Fallback: extrae del subdomain o path
        tenantSlug.value = slug;
        tenantName.value = slug.charAt(0).toUpperCase() + slug.slice(1);
        plan.value = 'BASIC';
        
        // Genera un ULID mock para demo
        tenantId.value = generateMockULID();
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cargando tenant';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Establece el contexto de tenant manualmente
   * @param {TenantContext} context - Contexto del tenant
   */
  function setTenant(context: TenantContext): void {
    tenantId.value = context.tenantId;
    tenantSlug.value = context.tenantSlug;
    tenantName.value = context.tenantName;
    plan.value = context.plan;
    
    // Persiste en localStorage
    localStorage.setItem(`tenant_${context.tenantSlug}`, JSON.stringify(context));
  }

  /**
   * Limpia el contexto de tenant
   */
  function clearTenant(): void {
    if (tenantSlug.value) {
      localStorage.removeItem(`tenant_${tenantSlug.value}`);
    }
    
    tenantId.value = null;
    tenantSlug.value = '';
    tenantName.value = '';
    plan.value = '';
    error.value = null;
  }

  /**
   * Extrae el slug del tenant desde la URL actual
   * @returns {string | null} Slug del tenant o null
   */
  function extractTenantFromUrl(): string | null {
    const hostname = window.location.hostname;
    const path = window.location.pathname;
    
    // Patrón: tenant.efectivo360.test
    const subdomainMatch = hostname.match(/^([^.]+)\.efectivo360\./);
    if (subdomainMatch) {
      return subdomainMatch[1];
    }
    
    // Patrón: efectivo360.test/t/:slug
    const pathMatch = path.match(/\/t\/([^/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }
    
    return null;
  }

  /**
   * Inicializa el tenant automáticamente desde URL o storage
   */
  async function initTenant(): Promise<void> {
    const slug = extractTenantFromUrl();
    if (slug && slug !== tenantSlug.value) {
      await loadTenant(slug);
    }
  }

  return {
    // State
    tenantId,
    tenantSlug,
    tenantName,
    plan,
    isLoading,
    error,
    // Getters
    isTenantLoaded,
    currentTenant,
    isProPlan,
    isEnterprisePlan,
    // Actions
    loadTenant,
    setTenant,
    clearTenant,
    initTenant,
    extractTenantFromUrl,
  };
});

/**
 * Genera un ULID mock para demostración
 * @returns {string} ULID simulado
 */
function generateMockULID(): string {
  const timestamp = Date.now().toString(36).toUpperCase().padStart(10, '0');
  const random = Math.random().toString(36).substring(2, 16).toUpperCase().padStart(16, '0');
  return `${timestamp}${random}`;
}
