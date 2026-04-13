/**
 * @fileoverview Tipos base globales para Efectivo 360 ERP
 * @module @core/types
 */

/** Representa un ULID (Universally Unique Lexicographically Sortable Identifier) */
export type ULID = string;

/** Representa un UUID estándar */
export type UUID = string;

/** Tipos de categorías de pago para multi-tenant */
export type PaymentCategory = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'CREDIT' | 'OTHER';

/** Estados de entidades en el sistema */
export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

/** Respuesta paginada estándar de la API */
export interface PaginatedResponse<T> {
  /** Lista de resultados */
  results: T[];
  /** Total de registros */
  count: number;
  /** URL de la siguiente página (null si es la última) */
  next: string | null;
  /** URL de la página anterior (null si es la primera) */
  previous: string | null;
}

/** Respuesta estándar de la API para operaciones CRUD */
export interface ApiResponse<T> {
  /** Datos de la respuesta */
  data: T;
  /** Mensaje descriptivo */
  message: string;
  /** Indica si la operación fue exitosa */
  success: boolean;
}

/** Error estándar de la API */
export interface ApiError {
  /** Código de error HTTP */
  status: number;
  /** Mensaje de error */
  message: string;
  /** Detalles adicionales del error (validaciones, etc.) */
  details?: Record<string, string[]>;
  /** Timestamp del error */
  timestamp?: string;
}

/** Contexto de tenant para multi-tenancy */
export interface TenantContext {
  /** ID del tenant actual */
  tenantId: ULID;
  /** Slug del tenant para URLs */
  tenantSlug: string;
  /** Nombre del tenant */
  tenantName: string;
  /** Plan/Subscription del tenant */
  plan: string;
}

/** Configuración de paginación para queries */
export interface PaginationParams {
  /** Número de página (1-based) */
  page?: number;
  /** Registros por página */
  pageSize?: number;
  /** Campo para ordenar */
  ordering?: string;
}

/** Filtros base para búsquedas */
export interface BaseFilters extends PaginationParams {
  /** Búsqueda por texto */
  search?: string;
  /** Fecha de inicio */
  dateFrom?: string;
  /** Fecha de fin */
  dateTo?: string;
  /** Estados específicos */
  status?: EntityStatus[];
}

/** Metadatos de auditoría */
export interface AuditMetadata {
  /** ID del usuario que creó el registro */
  createdBy: ULID;
  /** ID del usuario que actualizó el registro */
  updatedBy: ULID;
  /** Fecha de creación (ISO 8601) */
  createdAt: string;
  /** Fecha de última actualización (ISO 8601) */
  updatedAt: string;
}

/** Entidad base con ID ULID y auditoría */
export interface BaseEntity extends AuditMetadata {
  /** ID único (ULID) */
  id: ULID;
  /** Estado de la entidad */
  status: EntityStatus;
}
