/**
 * @fileoverview Servicios del módulo Vaults
 * @module @modules/vaults/services
 */

import { httpClient } from '@/core/services/axios.config';
import type {
  Vault,
  VaultCreateRequest,
  VaultUpdateRequest,
  VaultCloneRequest,
  VaultValidationRequest,
  VaultValidationResponse,
  VaultFilters,
} from '../types';

// =============================================================================
// API SERVICE
// =============================================================================

class VaultsService {
  private readonly basePath = '/api/v1/vaults';

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * Obtiene todos los vaults según el contexto del usuario
   */
  async getVaults(filters?: VaultFilters): Promise<Vault[]> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('vault_type', filters.type);
    if (filters?.status !== undefined) params.append('is_active', filters.status.toString());
    if (filters?.currency) params.append('default_currency', filters.currency);

    const response = await httpClient.get(`${this.basePath}/`, { params });
    return response.data;
  }

  /**
   * Obtiene solo los templates (solo staff)
   */
  async getTemplates(filters?: VaultFilters): Promise<Vault[]> {
    const params = new URLSearchParams({ blueprint_mode: 'true' });
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('vault_type', filters.type);
    if (filters?.status !== undefined) params.append('is_active', filters.status.toString());

    const response = await httpClient.get(`${this.basePath}/templates/`, { params });
    return response.data;
  }

  /**
   * Obtiene los vaults del tenant actual
   */
  async getMyVaults(filters?: VaultFilters): Promise<Vault[]> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('vault_type', filters.type);
    if (filters?.status !== undefined) params.append('is_active', filters.status.toString());

    const response = await httpClient.get(`${this.basePath}/my_vaults/`, { params });
    return response.data;
  }

  /**
   * Obtiene un vault por ID
   */
  async getVault(id: string): Promise<Vault> {
    const response = await httpClient.get(`${this.basePath}/${id}/`);
    return response.data;
  }

  /**
   * Crea un nuevo vault
   */
  async createVault(data: VaultCreateRequest): Promise<Vault> {
    const response = await httpClient.post(`${this.basePath}/`, data);
    return response.data;
  }

  /**
   * Actualiza un vault existente
   */
  async updateVault(id: string, data: VaultUpdateRequest): Promise<Vault> {
    const response = await httpClient.patch(`${this.basePath}/${id}/`, data);
    return response.data;
  }

  /**
   * Elimina un vault
   */
  async deleteVault(id: string): Promise<void> {
    await httpClient.delete(`${this.basePath}/${id}/`);
  }

  // =============================================================================
  // SPECIAL ACTIONS
  // =============================================================================

  /**
   * Clona un template a un tenant específico
   */
  async cloneVault(id: string, data: VaultCloneRequest): Promise<Vault> {
    const response = await httpClient.post(`${this.basePath}/${id}/clone_to_tenant/`, data);
    return response.data;
  }

  /**
   * Valida un vault contra reglas financieras
   */
  async validateVault(id: string, data: VaultValidationRequest): Promise<VaultValidationResponse> {
    const response = await httpClient.post(`${this.basePath}/${id}/validate_custom_vault/`, data);
    return response.data;
  }

  // =============================================================================
  // BATCH OPERATIONS
  // =============================================================================

  /**
   * Clona múltiples templates a un tenant
   */
  async cloneMultipleTemplates(templateIds: string[], tenantId: string): Promise<Vault[]> {
    const promises = templateIds.map(id => 
      this.cloneVault(id, { tenant_id: tenantId })
    );
    return Promise.all(promises);
  }

  /**
   * Activa/desactiva múltiples vaults
   */
  async toggleMultipleVaults(ids: string[], isActive: boolean): Promise<Vault[]> {
    const promises = ids.map(id => 
      this.updateVault(id, { is_active: isActive })
    );
    return Promise.all(promises);
  }

  // =============================================================================
  // UTILITIES
  // =============================================================================

  /**
   * Verifica si un código de vault está disponible
   */
  async checkCodeAvailability(code: string, tenantId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ code });
      if (tenantId) params.append('tenant_id', tenantId);
      
      await httpClient.get(`${this.basePath}/check_code/`, { params });
      return true; // 200 means available
    } catch (error) {
      return false; // 400 means taken
    }
  }

  /**
   * Exporta vaults a CSV
   */
  async exportVaults(filters?: VaultFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('vault_type', filters.type);
    if (filters?.status !== undefined) params.append('is_active', filters.status.toString());

    const response = await httpClient.get(`${this.basePath}/export/`, { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

// =============================================================================
// INSTANCE
// =============================================================================

export const vaultsService = new VaultsService();

// =============================================================================
// TYPES EXPORT
// =============================================================================

export type { Vault, VaultCreateRequest, VaultUpdateRequest, VaultCloneRequest, VaultValidationRequest, VaultValidationResponse, VaultFilters };
