/**
 * @fileoverview Punto de entrada público del módulo @core
 * @module @core
 * 
 * Este módulo exporta únicamente la API pública que otros módulos pueden consumir.
 * Ningún módulo externo debe importar archivos internos de @core directamente.
 */

// Types
export type {
  ULID,
  UUID,
  PaymentCategory,
  EntityStatus,
  PaginatedResponse,
  ApiResponse,
  ApiError,
  TenantContext,
  PaginationParams,
  BaseFilters,
  AuditMetadata,
  BaseEntity,
} from './types';

// Axios HTTP Client
export { httpClient, createAxiosInstance } from './services/axios.config';

// Stores
export { useTenantStore } from './stores/tenantStore';
