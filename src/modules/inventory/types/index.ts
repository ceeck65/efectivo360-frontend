/**
 * @fileoverview Tipos específicos del módulo Inventory
 * @module @modules/inventory/types
 */

import type { ULID, BaseEntity, BaseFilters, PaginatedResponse } from '@core/types';

/** Categoría de producto en inventario */
export type ProductCategory = 
  | 'RAW_MATERIAL' 
  | 'FINISHED_GOOD' 
  | 'SERVICE' 
  | 'CONSUMABLE' 
  | 'ASSET';

/** Unidad de medida para productos */
export type UnitOfMeasure = 
  | 'UNIT' 
  | 'KG' 
  | 'G' 
  | 'L' 
  | 'ML' 
  | 'M' 
  | 'CM' 
  | 'BOX' 
  | 'PACK';

/** Tipo de movimiento de inventario */
export type StockMovementType = 
  | 'IN'           // Entrada
  | 'OUT'          // Salida
  | 'ADJUSTMENT'   // Ajuste
  | 'TRANSFER'     // Transferencia
  | 'RETURN'       // Devolución
  | 'SALE'         // Venta
  | 'PURCHASE';    // Compra

/** Nivel de stock para alertas visuales */
export type StockLevel = 'CRITICAL' | 'LOW' | 'NORMAL' | 'HIGH';

/** Entidad Producto del inventario */
export interface Product extends BaseEntity {
  /** Código SKU único */
  sku: string;
  /** Nombre del producto */
  name: string;
  /** Descripción detallada */
  description: string;
  /** Categoría del producto */
  category: ProductCategory;
  /** ID de la categoría (ULID) */
  categoryId: ULID;
  /** Unidad de medida base */
  unitOfMeasure: UnitOfMeasure;
  /** Precio de venta (en centavos para evitar floats) */
  salePrice: number;
  /** Precio de costo (en centavos) */
  costPrice: number;
  /** Cantidad en stock actual */
  currentStock: number;
  /** Stock mínimo para alertas */
  minStockLevel: number;
  /** Stock máximo recomendado */
  maxStockLevel: number;
  /** Ubicación física en almacén */
  location?: string;
  /** Código de barras/EAN */
  barcode?: string;
  /** Producto activo para venta */
  isActive: boolean;
  /** Producto con seguimiento de lotes */
  trackLots: boolean;
  /** Producto con fecha de vencimiento */
  trackExpiry: boolean;
  /** Index signature para compatibilidad con Record<string, unknown> */
  [key: string]: unknown;
}

/** Entidad Categoría de producto */
export interface ProductCategoryEntity extends BaseEntity {
  /** Nombre de la categoría */
  name: string;
  /** Descripción */
  description: string;
  /** Color para identificación visual */
  color: string;
  /** Ícono asociado */
  icon?: string;
  /** Categoría padre (para jerarquías) */
  parentId?: ULID;
}

/** Entidad Movimiento de Stock */
export interface StockMovement extends BaseEntity {
  /** Producto afectado */
  productId: ULID;
  /** Información resumida del producto */
  productName: string;
  /** Tipo de movimiento */
  movementType: StockMovementType;
  /** Cantidad movida (positiva o negativa) */
  quantity: number;
  /** Costo unitario al momento del movimiento */
  unitCost: number;
  /** Referencia a documento origen (venta, compra, etc.) */
  referenceType?: string;
  /** ID del documento origen */
  referenceId?: ULID;
  /** Número de documento para referencia humana */
  referenceNumber?: string;
  /** Notas adicionales */
  notes?: string;
  /** ID del usuario que realizó el movimiento */
  performedBy: ULID;
  /** Nombre del usuario */
  performedByName: string;
  /** Fecha efectiva del movimiento */
  movementDate: string;
}

/** Entidad Lote de producto */
export interface ProductLot extends BaseEntity {
  /** Producto asociado */
  productId: ULID;
  /** Número de lote */
  lotNumber: string;
  /** Fecha de fabricación */
  manufactureDate?: string;
  /** Fecha de vencimiento */
  expiryDate?: string;
  /** Cantidad inicial */
  initialQuantity: number;
  /** Cantidad actual disponible */
  currentQuantity: number;
  /** Ubicación física */
  location?: string;
  /** Costo promedio del lote */
  averageCost: number;
}

/** Filtros para búsqueda de productos */
export interface ProductFilters extends BaseFilters {
  /** Filtrar por categoría */
  categoryId?: ULID;
  /** Filtrar por tipo de categoría */
  category?: ProductCategory;
  /** Solo productos con stock bajo */
  lowStockOnly?: boolean;
  /** Solo productos activos */
  activeOnly?: boolean;
  /** SKU exacto o parcial */
  sku?: string;
  /** Rango de precio mínimo (en centavos) */
  minPrice?: number;
  /** Rango de precio máximo (en centavos) */
  maxPrice?: number;
  /** Tiene lotes con vencimiento próximo */
  expiringSoon?: boolean;
}

/** Filtros para movimientos de stock */
export interface StockMovementFilters extends BaseFilters {
  /** Producto específico */
  productId?: ULID;
  /** Tipo de movimiento */
  movementType?: StockMovementType[];
  /** Rango de fechas */
  dateFrom?: string;
  dateTo?: string;
  /** Usuario que realizó el movimiento */
  performedBy?: ULID;
  /** Tipo de referencia */
  referenceType?: string;
}

/** Resumen de inventario para dashboard */
export interface InventorySummary {
  /** Total de productos */
  totalProducts: number;
  /** Productos con stock bajo */
  lowStockCount: number;
  /** Productos sin stock */
  outOfStockCount: number;
  /** Valor total del inventario (costo) */
  totalInventoryValue: number;
  /** Valor potencial de ventas */
  potentialRevenue: number;
  /** Movimientos hoy */
  todayMovements: number;
  /** Alertas de vencimiento próximo */
  expiringLotsCount: number;
}

/** Respuestas de API tipadas */
export type ProductListResponse = PaginatedResponse<Product>;
export type ProductResponse = { data: Product };
export type ProductCategoryListResponse = PaginatedResponse<ProductCategoryEntity>;
export type StockMovementListResponse = PaginatedResponse<StockMovement>;
export type InventorySummaryResponse = { data: InventorySummary };

/** DTOs para operaciones CRUD */
export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  categoryId: ULID;
  unitOfMeasure: UnitOfMeasure;
  salePrice: number;
  costPrice: number;
  initialStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  location?: string;
  barcode?: string;
  trackLots?: boolean;
  trackExpiry?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  isActive?: boolean;
}

export interface CreateStockMovementDTO {
  productId: ULID;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: ULID;
  referenceNumber?: string;
  notes?: string;
  lotNumber?: string;
  expiryDate?: string;
}
